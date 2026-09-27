use crate::aptly::{AuthConfig, ConnectionProfile, SUPPORTED_APTLY_VERSION};
use serde::Serialize;
use std::env;

#[derive(Clone)]
pub struct AppConfig {
    pub bind: String,
    pub static_dir: String,
    pub profile: ConnectionProfile,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublicConfig {
    pub dashboard_version: &'static str,
    pub profile_name: String,
    pub aptly_base_url: String,
    pub public_repository_url: Option<String>,
    pub auth_mode: String,
    pub expected_aptly_version: &'static str,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let auth_mode = env_var("APTLY_AUTH_MODE", "none");
        let auth = match auth_mode.as_str() {
            "basic" => AuthConfig {
                mode: auth_mode,
                username: env::var("APTLY_AUTH_USERNAME").ok(),
                password: env::var("APTLY_AUTH_PASSWORD").ok(),
                token: None,
                header_name: None,
                header_value: None,
            },
            "bearer" => AuthConfig {
                mode: auth_mode,
                username: None,
                password: None,
                token: env::var("APTLY_AUTH_TOKEN").ok(),
                header_name: None,
                header_value: None,
            },
            "header" => AuthConfig {
                mode: auth_mode,
                username: None,
                password: None,
                token: None,
                header_name: env::var("APTLY_AUTH_HEADER_NAME").ok(),
                header_value: env::var("APTLY_AUTH_HEADER_VALUE").ok(),
            },
            _ => AuthConfig::none(),
        };

        Self {
            bind: env_var("DASHBOARD_BIND", "0.0.0.0:8080"),
            static_dir: env_var("DASHBOARD_STATIC_DIR", "dist"),
            profile: ConnectionProfile {
                name: env_var("APTLY_PROFILE_NAME", "Aptly del stack"),
                base_url: env_var("APTLY_URL", "http://aptly:8080"),
                public_repository_url: env::var("PUBLIC_REPOSITORY_URL")
                    .ok()
                    .filter(|value| !value.trim().is_empty()),
                auth,
            },
        }
    }

    pub fn public(&self) -> PublicConfig {
        PublicConfig {
            dashboard_version: env!("CARGO_PKG_VERSION"),
            profile_name: self.profile.name.clone(),
            aptly_base_url: self.profile.base_url.clone(),
            public_repository_url: self.profile.public_repository_url.clone(),
            auth_mode: self.profile.auth.mode.clone(),
            expected_aptly_version: SUPPORTED_APTLY_VERSION,
        }
    }
}

fn env_var(name: &str, default: &str) -> String {
    env::var(name)
        .ok()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| default.to_string())
}
