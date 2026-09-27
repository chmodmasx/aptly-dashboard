use serde::{Deserialize, Serialize};
use std::{
    io,
    path::{Path, PathBuf},
};
use tokio::{fs, sync::RwLock};

const STATE_SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DashboardState {
    pub schema_version: u32,
    pub public_endpoints: Vec<PublicEndpoint>,
}

impl Default for DashboardState {
    fn default() -> Self {
        Self {
            schema_version: STATE_SCHEMA_VERSION,
            public_endpoints: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PublicEndpoint {
    pub hostname: String,
    pub prefix: String,
    pub enabled: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EndpointUpdate {
    pub prefix: String,
    pub enabled: Option<bool>,
}

pub struct StateStore {
    path: PathBuf,
    inner: RwLock<DashboardState>,
}

impl StateStore {
    pub async fn load(data_dir: impl AsRef<Path>) -> io::Result<Self> {
        let data_dir = data_dir.as_ref();
        fs::create_dir_all(data_dir).await?;
        let path = data_dir.join("state.json");

        let state = match read_state_file(data_dir).await {
            Ok(state) => state,
            Err(error) if error.kind() == io::ErrorKind::NotFound => {
                let state = DashboardState::default();
                persist_state(&path, &state).await?;
                state
            }
            Err(error) => return Err(error),
        };

        if state.schema_version != STATE_SCHEMA_VERSION {
            return Err(io::Error::new(
                io::ErrorKind::InvalidData,
                format!(
                    "schema de state.json no soportado: {} (esperado {})",
                    state.schema_version, STATE_SCHEMA_VERSION
                ),
            ));
        }

        Ok(Self {
            path,
            inner: RwLock::new(state),
        })
    }

    pub async fn snapshot(&self) -> DashboardState {
        self.inner.read().await.clone()
    }

    pub async fn endpoints(&self) -> Vec<PublicEndpoint> {
        self.inner.read().await.public_endpoints.clone()
    }

    pub async fn upsert_endpoint(
        &self,
        hostname: &str,
        update: EndpointUpdate,
    ) -> Result<PublicEndpoint, StateError> {
        let hostname = normalize_hostname(hostname)?;
        let prefix = normalize_prefix(&update.prefix)?;
        let endpoint = PublicEndpoint {
            hostname: hostname.clone(),
            prefix,
            enabled: update.enabled.unwrap_or(true),
        };

        let mut guard = self.inner.write().await;
        let mut next = guard.clone();

        if let Some(existing) = next
            .public_endpoints
            .iter_mut()
            .find(|item| item.hostname == hostname)
        {
            *existing = endpoint.clone();
        } else {
            next.public_endpoints.push(endpoint.clone());
            next.public_endpoints
                .sort_by(|left, right| left.hostname.cmp(&right.hostname));
        }

        persist_state(&self.path, &next)
            .await
            .map_err(StateError::io)?;

        *guard = next;
        Ok(endpoint)
    }

    pub async fn delete_endpoint(&self, hostname: &str) -> Result<bool, StateError> {
        let hostname = normalize_hostname(hostname)?;
        let mut guard = self.inner.write().await;
        let mut next = guard.clone();
        let before = next.public_endpoints.len();

        next.public_endpoints
            .retain(|item| item.hostname != hostname);

        if next.public_endpoints.len() == before {
            return Ok(false);
        }

        persist_state(&self.path, &next)
            .await
            .map_err(StateError::io)?;

        *guard = next;
        Ok(true)
    }
}

#[derive(Debug)]
pub struct StateError {
    pub kind: &'static str,
    pub message: String,
}

impl StateError {
    fn validation(message: impl Into<String>) -> Self {
        Self {
            kind: "validation",
            message: message.into(),
        }
    }

    fn io(error: io::Error) -> Self {
        Self {
            kind: "storage",
            message: format!("No se pudo guardar el estado del Dashboard: {error}"),
        }
    }
}

async fn persist_state(path: &Path, state: &DashboardState) -> io::Result<()> {
    let bytes = serde_json::to_vec_pretty(state)
        .map_err(|error| io::Error::new(io::ErrorKind::InvalidData, error))?;
    let temp = path.with_extension("json.tmp");

    fs::write(&temp, bytes).await?;
    fs::rename(&temp, path).await?;
    Ok(())
}

fn normalize_hostname(value: &str) -> Result<String, StateError> {
    let hostname = value.trim().trim_end_matches('.').to_ascii_lowercase();

    if hostname.is_empty() || hostname.len() > 253 {
        return Err(StateError::validation("El hostname no es válido."));
    }

    if hostname.contains('/')
        || hostname.contains(':')
        || hostname.split('.').any(|label| {
            label.is_empty()
                || label.len() > 63
                || label.starts_with('-')
                || label.ends_with('-')
                || !label
                    .bytes()
                    .all(|byte| byte.is_ascii_alphanumeric() || byte == b'-')
        })
    {
        return Err(StateError::validation(
            "Ingresá un hostname DNS, sin esquema, puerto ni ruta.",
        ));
    }

    Ok(hostname)
}

fn normalize_prefix(value: &str) -> Result<String, StateError> {
    let prefix = value.trim().trim_matches('/');

    if prefix.is_empty() {
        return Ok(".".to_string());
    }

    if prefix == "." {
        return Ok(prefix.to_string());
    }

    if prefix.len() > 240
        || prefix.split('/').any(|segment| {
            segment.is_empty()
                || segment == "."
                || segment == ".."
                || !segment.bytes().all(|byte| {
                    byte.is_ascii_alphanumeric()
                        || byte == b'-'
                        || byte == b'_'
                        || byte == b'.'
                })
        })
    {
        return Err(StateError::validation(
            "El prefix contiene una ruta no válida.",
        ));
    }

    Ok(prefix.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalizes_hostname() {
        assert_eq!(
            normalize_hostname("Repo.SupraLinux.COM.").unwrap(),
            "repo.supralinux.com"
        );
    }

    #[test]
    fn rejects_hostname_with_scheme_or_port() {
        assert!(normalize_hostname("https://repo.example.com").is_err());
        assert!(normalize_hostname("repo.example.com:443").is_err());
    }

    #[test]
    fn normalizes_publication_prefix() {
        assert_eq!(normalize_prefix("/supralinux/").unwrap(), "supralinux");
        assert_eq!(normalize_prefix("").unwrap(), ".");
        assert!(normalize_prefix("../secret").is_err());
    }
}


pub async fn read_state_file(data_dir: impl AsRef<Path>) -> io::Result<DashboardState> {
    let path = data_dir.as_ref().join("state.json");
    let bytes = fs::read(path).await?;
    let state = serde_json::from_slice::<DashboardState>(&bytes).map_err(|error| {
        io::Error::new(
            io::ErrorKind::InvalidData,
            format!("state.json inválido: {error}"),
        )
    })?;

    if state.schema_version != STATE_SCHEMA_VERSION {
        return Err(io::Error::new(
            io::ErrorKind::InvalidData,
            format!(
                "schema de state.json no soportado: {} (esperado {})",
                state.schema_version, STATE_SCHEMA_VERSION
            ),
        ));
    }

    Ok(state)
}
