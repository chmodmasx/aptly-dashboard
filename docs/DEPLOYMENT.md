# Deployment strategy

## Principle

Aptly Dashboard does not require Docker.

It only requires access to a compatible Aptly REST API.

Docker Compose is offered as one convenient way to deploy such an API.

## Supported deployment styles

The product should remain agnostic to where Aptly runs:

1. native host installation;
2. systemd service;
3. Docker Compose;
4. Portainer stack;
5. Podman or another OCI runtime;
6. remote server or VM.

The desktop UI should behave the same once the API profile is configured.

## Reference Compose

The repository will provide an optional `deploy/compose.yaml`.

It should use plain Compose features so the same file can be:

- started with `docker compose up -d`;
- imported into Portainer as a stack;
- adapted to an existing reverse proxy;
- used as documentation for users who prefer their own tooling.

The reference stack should not require the dashboard application to be running.

## Compose design rules

- no `container_name` unless there is a compelling reason;
- no Docker socket mount;
- no privileged containers;
- explicit image versions, never floating `latest`;
- persistent named volumes;
- healthchecks;
- `restart: unless-stopped` where appropriate;
- environment-variable overrides for ports and paths;
- sensible localhost-safe defaults for the administrative API;
- repository-serving service separated from Aptly API service.

## Image strategy

The project may publish a small Aptly image to GHCR if no maintained upstream image matches the supported Aptly version and deployment requirements.

That image is an **optional server artifact**, not something bundled or controlled by Tauri.

Suggested naming:

```text
ghcr.io/chmodmasx/aptly-dashboard-aptly:<aptly-version>-<image-revision>
```

For example:

```text
ghcr.io/chmodmasx/aptly-dashboard-aptly:1.6.3-1
```

The tag should make the Aptly version obvious.

## Local deployment

Safe initial example:

```text
Aptly API:
127.0.0.1:<port> -> aptly:8080

Published repository:
0.0.0.0:<repo-port> -> repo-server:80
```

The administrative API is localhost-only while the published repository can intentionally be reachable from the LAN.

## Remote deployment

A raw Aptly API should not simply be published to the Internet.

Recommended shape:

```text
Aptly Dashboard
      │
      │ HTTPS + authentication
      ▼
reverse proxy / gateway
      │
      ▼
Aptly API
```

The dashboard connection profile should support credentials used by that proxy.

The public APT repository URL can be independent from the administrative API URL.

## Portainer

The Portainer use case is a first-class deployment target for the reference Compose file.

Avoid Compose tricks that require local preprocessing. Environment variables should be documented so a user can paste the YAML into Portainer, configure values in the stack UI, and deploy.

## What the app does not do

The desktop application will not:

- create containers;
- stop/start containers;
- assume Docker is installed;
- require access to the Docker daemon;
- manage Portainer;
- manage the reverse proxy.

This separation keeps the client useful in more environments and avoids coupling Aptly administration to one container runtime.
