mod aptly;
mod config;
mod state;
mod repo_server;

use aptly::{test_connection, ConnectionError, ConnectionTestResult};
use axum::{
    extract::{Path as AxumPath, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post, put},
    Json, Router,
};
use config::{AppConfig, PublicConfig};
use serde::Serialize;
use state::{DashboardState, EndpointUpdate, PublicEndpoint, StateError, StateStore};
use std::{path::PathBuf, sync::Arc};
use tower_http::{
    services::{ServeDir, ServeFile},
    trace::TraceLayer,
};
use tracing::info;
use tracing_subscriber::EnvFilter;

#[derive(Clone)]
struct AppState {
    config: Arc<AppConfig>,
    store: Arc<StateStore>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReadyResponse {
    status: &'static str,
    aptly_version: Option<String>,
    compatibility: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ErrorResponse {
    kind: String,
    message: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("aptly_dashboard_server=info,tower_http=info")),
        )
        .init();

    match std::env::args().nth(1).as_deref() {
        None | Some("dashboard") => run_dashboard().await,
        Some("repo-server") => repo_server::run().await,
        Some(other) => {
            eprintln!("modo desconocido: {other}. Usá 'dashboard' o 'repo-server'.");
            std::process::exit(2);
        }
    }
}

async fn run_dashboard() {
    let config = AppConfig::from_env();
    let bind = config.bind.clone();
    let static_dir = PathBuf::from(&config.static_dir);
    let index = static_dir.join("index.html");
    let store = StateStore::load(&config.data_dir)
        .await
        .unwrap_or_else(|error| panic!("no se pudo cargar el estado persistente: {error}"));

    let state = AppState {
        config: Arc::new(config),
        store: Arc::new(store),
    };

    let static_service = ServeDir::new(&static_dir)
        .not_found_service(ServeFile::new(index));

    let app = Router::new()
        .route("/api/dashboard/health", get(health))
        .route("/api/dashboard/ready", get(ready))
        .route("/api/dashboard/config", get(public_config))
        .route("/api/dashboard/state", get(dashboard_state))
        .route("/api/dashboard/aptly/status", get(aptly_status))
        .route("/api/dashboard/aptly/test", post(aptly_status))
        .route("/api/dashboard/endpoints", get(list_endpoints))
        .route(
            "/api/dashboard/endpoints/{hostname}",
            put(upsert_endpoint).delete(delete_endpoint),
        )
        .fallback_service(static_service)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&bind)
        .await
        .unwrap_or_else(|error| panic!("no se pudo abrir {}: {}", bind, error));

    info!("Aptly Dashboard escuchando en http://{}", bind);

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("error del servidor HTTP");
}

async fn health() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}

async fn ready(State(state): State<AppState>) -> impl IntoResponse {
    match test_connection(&state.config.profile).await {
        Ok(result)
            if result.compatibility == "supported" && result.healthy && result.ready =>
        {
            (
                StatusCode::OK,
                Json(ReadyResponse {
                    status: "ready",
                    aptly_version: Some(result.version),
                    compatibility: Some(result.compatibility),
                }),
            )
        }
        Ok(result) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ReadyResponse {
                status: "not_ready",
                aptly_version: Some(result.version),
                compatibility: Some(result.compatibility),
            }),
        ),
        Err(_) => (
            StatusCode::SERVICE_UNAVAILABLE,
            Json(ReadyResponse {
                status: "not_ready",
                aptly_version: None,
                compatibility: None,
            }),
        ),
    }
}

async fn public_config(State(state): State<AppState>) -> Json<PublicConfig> {
    Json(state.config.public())
}

async fn dashboard_state(State(state): State<AppState>) -> Json<DashboardState> {
    Json(state.store.snapshot().await)
}

async fn aptly_status(
    State(state): State<AppState>,
) -> Result<Json<ConnectionTestResult>, ApiError> {
    test_connection(&state.config.profile)
        .await
        .map(Json)
        .map_err(ApiError)
}

async fn list_endpoints(State(state): State<AppState>) -> Json<Vec<PublicEndpoint>> {
    Json(state.store.endpoints().await)
}

async fn upsert_endpoint(
    State(state): State<AppState>,
    AxumPath(hostname): AxumPath<String>,
    Json(update): Json<EndpointUpdate>,
) -> Result<Json<PublicEndpoint>, StateApiError> {
    state
        .store
        .upsert_endpoint(&hostname, update)
        .await
        .map(Json)
        .map_err(StateApiError)
}

async fn delete_endpoint(
    State(state): State<AppState>,
    AxumPath(hostname): AxumPath<String>,
) -> Result<StatusCode, StateApiError> {
    let removed = state
        .store
        .delete_endpoint(&hostname)
        .await
        .map_err(StateApiError)?;

    Ok(if removed {
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    })
}

struct ApiError(ConnectionError);

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        let status = match self.0.kind.as_str() {
            "invalid_url" | "client" => StatusCode::INTERNAL_SERVER_ERROR,
            _ => StatusCode::BAD_GATEWAY,
        };
        (status, Json(self.0)).into_response()
    }
}

struct StateApiError(StateError);

impl IntoResponse for StateApiError {
    fn into_response(self) -> axum::response::Response {
        let status = if self.0.kind == "validation" {
            StatusCode::BAD_REQUEST
        } else {
            StatusCode::INTERNAL_SERVER_ERROR
        };
        (
            status,
            Json(ErrorResponse {
                kind: self.0.kind.to_string(),
                message: self.0.message,
            }),
        )
            .into_response()
    }
}

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}
