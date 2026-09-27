mod aptly;
mod config;

use aptly::{test_connection, ConnectionError, ConnectionTestResult};
use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use config::{AppConfig, PublicConfig};
use serde::Serialize;
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
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("aptly_dashboard_server=info,tower_http=info")),
        )
        .init();

    let config = AppConfig::from_env();
    let bind = config.bind.clone();
    let static_dir = PathBuf::from(&config.static_dir);
    let index = static_dir.join("index.html");

    let state = AppState {
        config: Arc::new(config),
    };

    let static_service = ServeDir::new(&static_dir)
        .not_found_service(ServeFile::new(index));

    let app = Router::new()
        .route("/api/dashboard/health", get(health))
        .route("/api/dashboard/config", get(public_config))
        .route("/api/dashboard/aptly/status", get(aptly_status))
        .route("/api/dashboard/aptly/test", post(aptly_status))
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

async fn public_config(State(state): State<AppState>) -> Json<PublicConfig> {
    Json(state.config.public())
}

async fn aptly_status(
    State(state): State<AppState>,
) -> Result<Json<ConnectionTestResult>, ApiError> {
    test_connection(&state.config.profile)
        .await
        .map(Json)
        .map_err(ApiError)
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

async fn shutdown_signal() {
    let _ = tokio::signal::ctrl_c().await;
}
