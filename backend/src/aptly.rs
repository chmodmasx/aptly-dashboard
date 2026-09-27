use futures::future::join_all;
use reqwest::{
    header::{HeaderName, HeaderValue},
    Client, RequestBuilder, StatusCode, Url,
};
use semver::Version;
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};

pub const SUPPORTED_APTLY_VERSION: &str = "1.6.3";

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionProfile {
    pub name: String,
    pub base_url: String,
    pub public_repository_url: Option<String>,
    pub auth: AuthConfig,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthConfig {
    pub mode: String,
    pub username: Option<String>,
    pub password: Option<String>,
    pub token: Option<String>,
    pub header_name: Option<String>,
    pub header_value: Option<String>,
}

impl AuthConfig {
    pub fn none() -> Self {
        Self {
            mode: "none".to_string(),
            username: None,
            password: None,
            token: None,
            header_name: None,
            header_value: None,
        }
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionTestResult {
    pub profile_name: String,
    pub normalized_url: String,
    pub public_repository_url: Option<String>,
    pub version: String,
    pub compatibility: String,
    pub healthy: bool,
    pub ready: bool,
    pub latency_ms: u128,
    pub capabilities: AptlyCapabilities,
    pub warnings: Vec<String>,
}

#[derive(Debug, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AptlyCapabilities {
    pub repositories: bool,
    pub mirrors: bool,
    pub snapshots: bool,
    pub publications: bool,
    pub tasks: bool,
    pub storage: bool,
    pub gpg_keys: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionError {
    pub kind: String,
    pub message: String,
    pub operation: String,
    pub http_status: Option<u16>,
    pub technical_details: Option<String>,
}

impl ConnectionError {
    fn new(kind: &str, message: impl Into<String>, operation: &str) -> Self {
        Self {
            kind: kind.to_string(),
            message: message.into(),
            operation: operation.to_string(),
            http_status: None,
            technical_details: None,
        }
    }

    fn with_status(mut self, status: StatusCode) -> Self {
        self.http_status = Some(status.as_u16());
        self
    }

    fn with_details(mut self, details: impl Into<String>) -> Self {
        self.technical_details = Some(details.into());
        self
    }
}

#[derive(Debug, Deserialize)]
struct VersionResponse {
    #[serde(rename = "Version")]
    version: String,
}

struct ProbeResult {
    name: &'static str,
    supported: bool,
    status: Option<u16>,
    error: Option<String>,
}

pub async fn test_connection(
    profile: &ConnectionProfile,
) -> Result<ConnectionTestResult, ConnectionError> {
    let normalized_url = normalize_base_url(&profile.base_url)?;
    let client = Client::builder()
        .connect_timeout(Duration::from_secs(5))
        .timeout(Duration::from_secs(8))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent(format!("aptly-dashboard/{}", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|error| {
            ConnectionError::new("client", "No se pudo inicializar el cliente HTTP.", "client")
                .with_details(error.to_string())
        })?;

    let started = Instant::now();
    let version_url = api_url(&normalized_url, "version");
    let request = apply_auth(client.get(&version_url), &profile.auth)?;
    let response = request.send().await.map_err(|error| {
        network_error(
            "No se pudo conectar con la API de Aptly.",
            "GET /api/version",
            error,
        )
    })?;

    if response.status() == StatusCode::UNAUTHORIZED
        || response.status() == StatusCode::FORBIDDEN
    {
        return Err(
            ConnectionError::new(
                "authentication",
                "El servidor rechazó las credenciales.",
                "GET /api/version",
            )
            .with_status(response.status()),
        );
    }

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(
            ConnectionError::new(
                "http",
                format!("Aptly respondió con HTTP {}.", status.as_u16()),
                "GET /api/version",
            )
            .with_status(status)
            .with_details(limit_text(body, 800)),
        );
    }

    let version_response = response.json::<VersionResponse>().await.map_err(|error| {
        ConnectionError::new(
            "invalid_response",
            "La respuesta de /api/version no tiene el formato esperado de Aptly.",
            "GET /api/version",
        )
        .with_details(error.to_string())
    })?;

    let compatibility = classify_version(&version_response.version);
    let latency_ms = started.elapsed().as_millis();

    let health_future = probe_health(&client, &profile.auth, &normalized_url, "healthy");
    let ready_future = probe_health(&client, &profile.auth, &normalized_url, "ready");

    let specs = [
        ("repositories", "repos"),
        ("mirrors", "mirrors"),
        ("snapshots", "snapshots"),
        ("publications", "publish"),
        ("tasks", "tasks"),
        ("storage", "storage"),
        ("gpg_keys", "gpg/keys"),
    ];

    let capability_futures = specs
        .iter()
        .map(|(name, path)| probe_capability(&client, &profile.auth, &normalized_url, name, path));

    let (healthy, ready, probe_results) =
        futures::join!(health_future, ready_future, async { join_all(capability_futures).await });

    let mut capabilities = AptlyCapabilities::default();
    let mut warnings = Vec::new();

    for probe in probe_results {
        match probe.name {
            "repositories" => capabilities.repositories = probe.supported,
            "mirrors" => capabilities.mirrors = probe.supported,
            "snapshots" => capabilities.snapshots = probe.supported,
            "publications" => capabilities.publications = probe.supported,
            "tasks" => capabilities.tasks = probe.supported,
            "storage" => capabilities.storage = probe.supported,
            "gpg_keys" => capabilities.gpg_keys = probe.supported,
            _ => {}
        }

        if let Some(error) = probe.error {
            warnings.push(format!("{}: {}", probe.name, error));
        } else if !probe.supported {
            warnings.push(match probe.status {
                Some(status) => format!("{} no parece disponible (HTTP {}).", probe.name, status),
                None => format!("{} no pudo comprobarse.", probe.name),
            });
        }
    }

    if compatibility != "supported" {
        warnings.push(format!(
            "Aptly {} no forma parte de la matriz soportada actual (objetivo {}).",
            version_response.version, SUPPORTED_APTLY_VERSION
        ));
    }

    if !ready {
        warnings.push("La API responde, pero /api/ready no está lista.".to_string());
    }

    Ok(ConnectionTestResult {
        profile_name: profile.name.trim().to_string(),
        normalized_url,
        public_repository_url: profile
            .public_repository_url
            .clone()
            .filter(|value| !value.trim().is_empty()),
        version: version_response.version,
        compatibility,
        healthy,
        ready,
        latency_ms,
        capabilities,
        warnings,
    })
}

fn normalize_base_url(input: &str) -> Result<String, ConnectionError> {
    let input = input.trim();
    if input.is_empty() {
        return Err(ConnectionError::new(
            "invalid_url",
            "La URL interna de Aptly está vacía.",
            "validate_url",
        ));
    }

    let mut url = Url::parse(input).map_err(|error| {
        ConnectionError::new(
            "invalid_url",
            "La URL de Aptly no es válida. Usá http:// o https://.",
            "validate_url",
        )
        .with_details(error.to_string())
    })?;

    if url.scheme() != "http" && url.scheme() != "https" {
        return Err(ConnectionError::new(
            "invalid_url",
            "La API debe usar HTTP o HTTPS.",
            "validate_url",
        ));
    }

    if url.host_str().is_none() {
        return Err(ConnectionError::new(
            "invalid_url",
            "La URL no contiene un host válido.",
            "validate_url",
        ));
    }

    if !url.username().is_empty() || url.password().is_some() {
        return Err(ConnectionError::new(
            "invalid_url",
            "No incluyas credenciales dentro de la URL.",
            "validate_url",
        ));
    }

    url.set_query(None);
    url.set_fragment(None);

    let mut path = url.path().trim_end_matches('/').to_string();
    if path.ends_with("/api") {
        path.truncate(path.len() - 4);
    }
    if path.is_empty() {
        path = "/".to_string();
    }
    url.set_path(&path);

    Ok(url.as_str().trim_end_matches('/').to_string())
}

fn api_url(base_url: &str, path: &str) -> String {
    format!(
        "{}/api/{}",
        base_url.trim_end_matches('/'),
        path.trim_start_matches('/')
    )
}

fn apply_auth(
    request: RequestBuilder,
    auth: &AuthConfig,
) -> Result<RequestBuilder, ConnectionError> {
    match auth.mode.as_str() {
        "" | "none" => Ok(request),
        "basic" => {
            let username = auth.username.as_deref().unwrap_or("").trim();
            if username.is_empty() {
                return Err(ConnectionError::new(
                    "authentication",
                    "Falta el usuario de Basic Auth configurado en el backend.",
                    "authentication",
                ));
            }
            Ok(request.basic_auth(username, auth.password.clone()))
        }
        "bearer" => {
            let token = auth.token.as_deref().unwrap_or("").trim();
            if token.is_empty() {
                return Err(ConnectionError::new(
                    "authentication",
                    "Falta el Bearer token configurado en el backend.",
                    "authentication",
                ));
            }
            Ok(request.bearer_auth(token))
        }
        "header" => {
            let name = auth.header_name.as_deref().unwrap_or("").trim();
            let value = auth.header_value.as_deref().unwrap_or("").trim();
            if name.is_empty() || value.is_empty() {
                return Err(ConnectionError::new(
                    "authentication",
                    "Falta el header personalizado configurado en el backend.",
                    "authentication",
                ));
            }

            let header_name = HeaderName::from_bytes(name.as_bytes()).map_err(|error| {
                ConnectionError::new(
                    "authentication",
                    "El nombre del header personalizado no es válido.",
                    "authentication",
                )
                .with_details(error.to_string())
            })?;
            let header_value = HeaderValue::from_str(value).map_err(|error| {
                ConnectionError::new(
                    "authentication",
                    "El valor del header personalizado no es válido.",
                    "authentication",
                )
                .with_details(error.to_string())
            })?;

            Ok(request.header(header_name, header_value))
        }
        _ => Err(ConnectionError::new(
            "authentication",
            "El modo de autenticación configurado no es compatible.",
            "authentication",
        )),
    }
}

async fn probe_health(
    client: &Client,
    auth: &AuthConfig,
    base_url: &str,
    path: &str,
) -> bool {
    let url = api_url(base_url, path);
    let request = match apply_auth(client.get(url), auth) {
        Ok(request) => request,
        Err(_) => return false,
    };

    request
        .send()
        .await
        .map(|response| response.status().is_success())
        .unwrap_or(false)
}

async fn probe_capability(
    client: &Client,
    auth: &AuthConfig,
    base_url: &str,
    name: &'static str,
    path: &str,
) -> ProbeResult {
    let url = api_url(base_url, path);
    let request = match apply_auth(client.get(url), auth) {
        Ok(request) => request,
        Err(error) => {
            return ProbeResult {
                name,
                supported: false,
                status: error.http_status,
                error: Some(error.message),
            }
        }
    };

    match request.send().await {
        Ok(response) => {
            let status = response.status();
            ProbeResult {
                name,
                supported: status != StatusCode::NOT_FOUND
                    && status != StatusCode::METHOD_NOT_ALLOWED,
                status: Some(status.as_u16()),
                error: None,
            }
        }
        Err(error) => ProbeResult {
            name,
            supported: false,
            status: None,
            error: Some(error.to_string()),
        },
    }
}

fn classify_version(value: &str) -> String {
    let clean = value.trim().trim_start_matches('v');
    match Version::parse(clean) {
        Ok(version) if version == Version::new(1, 6, 3) => "supported".to_string(),
        Ok(version) if version.major == 1 && version.minor == 6 && version.patch > 3 => {
            "unverified".to_string()
        }
        Ok(version) if version.major > 1 || (version.major == 1 && version.minor > 6) => {
            "unverified".to_string()
        }
        _ => "unsupported".to_string(),
    }
}

fn network_error(message: &str, operation: &str, error: reqwest::Error) -> ConnectionError {
    let kind = if error.is_timeout() {
        "timeout"
    } else {
        "network"
    };

    ConnectionError::new(kind, message, operation).with_details(error.to_string())
}

fn limit_text(mut value: String, max_chars: usize) -> String {
    if value.chars().count() <= max_chars {
        return value;
    }
    value = value.chars().take(max_chars).collect();
    value.push('…');
    value
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_root_url() {
        assert_eq!(
            normalize_base_url("http://aptly:8080/").unwrap(),
            "http://aptly:8080"
        );
    }

    #[test]
    fn accepts_reverse_proxy_prefix() {
        assert_eq!(
            normalize_base_url("https://example.com/services/aptly/").unwrap(),
            "https://example.com/services/aptly"
        );
    }

    #[test]
    fn removes_accidental_api_suffix() {
        assert_eq!(
            normalize_base_url("https://example.com/aptly/api").unwrap(),
            "https://example.com/aptly"
        );
    }

    #[test]
    fn classifies_initial_target() {
        assert_eq!(classify_version("1.6.3"), "supported");
        assert_eq!(classify_version("1.6.4"), "unverified");
        assert_eq!(classify_version("1.6.2"), "unsupported");
    }
}
