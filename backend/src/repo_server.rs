use crate::state::{read_state_file, PublicEndpoint};
use axum::{
    body::Body,
    extract::State,
    http::{header::HOST, Method, Request, StatusCode},
    response::{IntoResponse, Response},
    routing::get,
    Router,
};
use std::{
    env,
    path::{Path, PathBuf},
    sync::Arc,
};
use tower::ServiceExt;
use tower_http::{services::ServeFile, trace::TraceLayer};
use tracing::{info, warn};

#[derive(Clone)]
struct RepoState {
    data_dir: Arc<PathBuf>,
    public_root: Arc<PathBuf>,
}

pub async fn run() {
    let bind = env_var("REPO_SERVER_BIND", "0.0.0.0:8081");
    let data_dir = PathBuf::from(env_var("DASHBOARD_DATA_DIR", "/data"));
    let public_root = PathBuf::from(env_var("APTLY_PUBLIC_ROOT", "/aptly/public"));

    let state = RepoState {
        data_dir: Arc::new(data_dir),
        public_root: Arc::new(public_root),
    };

    let app = Router::new()
        .route("/__health", get(health))
        .fallback(repo_request)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(&bind)
        .await
        .unwrap_or_else(|error| panic!("no se pudo abrir repo-server en {}: {}", bind, error));

    info!("repo-server escuchando en http://{}", bind);

    axum::serve(listener, app)
        .await
        .expect("error del repo-server");
}

async fn health() -> &'static str {
    "ok"
}

async fn repo_request(
    State(state): State<RepoState>,
    request: Request<Body>,
) -> Response {
    if request.method() != Method::GET && request.method() != Method::HEAD {
        return StatusCode::METHOD_NOT_ALLOWED.into_response();
    }

    let host = match request.headers().get(HOST).and_then(|value| value.to_str().ok()) {
        Some(value) => value.to_string(),
        None => return StatusCode::BAD_REQUEST.into_response(),
    };
    let request_path = request.uri().path().to_string();
    let hostname = strip_port(&host);

    let snapshot = match read_state_file(state.data_dir.as_ref()).await {
        Ok(state) => state,
        Err(error) => {
            warn!("no se pudo leer state.json para repo-server: {}", error);
            return StatusCode::SERVICE_UNAVAILABLE.into_response();
        }
    };

    let endpoint = match snapshot
        .public_endpoints
        .iter()
        .find(|item| item.enabled && item.hostname == hostname)
    {
        Some(endpoint) => endpoint,
        None => return StatusCode::NOT_FOUND.into_response(),
    };

    let relative_path = match safe_relative_path(&request_path) {
        Some(path) if !path.as_os_str().is_empty() => path,
        _ => return StatusCode::NOT_FOUND.into_response(),
    };

    let file_path = publication_file_path(state.public_root.as_ref(), endpoint, &relative_path);

    match ServeFile::new(file_path).oneshot(request).await {
        Ok(response) => response.map(Body::new),
        Err(error) => match error {},
    }
}

fn publication_file_path(root: &Path, endpoint: &PublicEndpoint, relative: &Path) -> PathBuf {
    let mut path = root.to_path_buf();
    if endpoint.prefix != "." {
        path.push(&endpoint.prefix);
    }
    path.push(relative);
    path
}

fn safe_relative_path(value: &str) -> Option<PathBuf> {
    let mut path = PathBuf::new();

    for segment in value.trim_start_matches('/').split('/') {
        if segment.is_empty() {
            continue;
        }
        if segment == "." || segment == ".." || segment.contains('\\') {
            return None;
        }
        path.push(segment);
    }

    Some(path)
}

fn strip_port(value: &str) -> String {
    let value = value.trim().trim_end_matches('.').to_ascii_lowercase();

    if let Some((host, port)) = value.rsplit_once(':') {
        if !host.contains(':') && port.bytes().all(|byte| byte.is_ascii_digit()) {
            return host.trim_end_matches('.').to_string();
        }
    }

    value
}

fn env_var(name: &str, default: &str) -> String {
    env::var(name)
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| default.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn strips_http_host_port() {
        assert_eq!(strip_port("repo.example.com:443"), "repo.example.com");
        assert_eq!(strip_port("Repo.Example.Com."), "repo.example.com");
    }

    #[test]
    fn rejects_parent_traversal() {
        assert!(safe_relative_path("/dists/stable/Release").is_some());
        assert!(safe_relative_path("/../secret").is_none());
        assert!(safe_relative_path("/pool/../../secret").is_none());
    }

    #[test]
    fn maps_hostname_prefix_to_publication_tree() {
        let endpoint = PublicEndpoint {
            hostname: "repo.example.com".to_string(),
            prefix: "supralinux".to_string(),
            enabled: true,
        };
        let path = publication_file_path(
            Path::new("/aptly/public"),
            &endpoint,
            Path::new("dists/stable/Release"),
        );
        assert_eq!(
            path,
            PathBuf::from("/aptly/public/supralinux/dists/stable/Release")
        );
    }
}
