# Docker / Portainer deployment

This directory defines the first stack skeleton for the Docker-first Aptly Dashboard architecture.

Current services:

- dashboard: React UI + Rust backend;
- aptly: operator-selected Aptly image.

The repo-server service will be added when the multi-domain publication layer is implemented.

## Important

Aptly Dashboard does not maintain an Aptly image.

Set APTLY_IMAGE to an image that satisfies the documented runtime contract and reports a supported Aptly version. The initial target is Aptly 1.6.3.

The selected image must expose its REST API to the private Docker network and persist its Aptly root at APTLY_DATA_PATH.

## Portainer

Copy deploy/compose.yaml into a Portainer Stack and define the values from .env.example in the Stack environment.

For Nginx Proxy Manager, set PROXY_NETWORK to the existing Docker network shared with NPM. The default is nginx-proxy-manager_default.

The Dashboard container joins that network. Aptly does not: its REST API remains only on the private internal network.

## Local source build

For development:

    docker compose --env-file deploy/.env -f deploy/compose.yaml -f deploy/compose.dev.yaml up -d --build

This builds the Dashboard image locally.

Aptly still requires APTLY_IMAGE because the project intentionally does not build or maintain Aptly.

## Persistent data

The stack creates:

- aptly-data;
- dashboard-data;
- backup-data.

Recreating images/containers leaves these volumes intact.

Do not use docker compose down -v unless you intentionally want to destroy all persistent data.

## Reverse proxy

Nginx Proxy Manager should point the administrative hostname, for example aptly.supralinux.com, to:

    dashboard:8080

on the shared proxy network.

Do not expose the raw Aptly REST API through NPM.

The public repository domains will later point to repo-server rather than dashboard.
