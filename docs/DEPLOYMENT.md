# Deployment strategy

## Principle

Aptly Dashboard does not require Docker and does not ship or manage its own Aptly distribution.

It only requires access to a **compatible Aptly REST API**.

Docker Compose is offered as one convenient deployment recipe, not as part of the desktop application's runtime.

## Supported deployment styles

The product should remain agnostic to where Aptly runs:

1. native host installation;
2. systemd service;
3. Docker Compose;
4. Portainer stack;
5. Podman or another OCI runtime;
6. remote server or VM.

The desktop UI behaves the same once the API profile is configured.

## Aptly ownership

This project maintains **Aptly Dashboard**, not Aptly.

Therefore we do not:

- fork Aptly;
- publish a modified Aptly build;
- maintain an `aptly-dashboard-aptly` container image;
- silently patch the Aptly API;
- require a particular container runtime.

Compatibility is defined against upstream Aptly versions and API capabilities.

Initial target: **Aptly 1.6.3**.

## Reference Compose

The repository may provide an optional `deploy/compose.yaml` for users who want Docker or Portainer.

The Compose file should be understood as a reference topology:

```text
compatible Aptly container
       │
       ├─ REST API
       └─ persistent Aptly data

optional repository HTTP server / user's existing proxy
```

It must not create a new Aptly distribution maintained by this project.

Because Aptly does not currently provide a clearly maintained Docker Official Image for every release, the reference deployment must document exactly which external image it was tested with. The dashboard's support promise remains tied to the **reported Aptly version/API**, not to that image.

If there is no external image we can responsibly recommend for the supported Aptly version, we should publish deployment guidance instead of pretending a questionable image is an official dependency.

## Compose design rules

- no Docker socket mount;
- no privileged containers;
- explicit image tag/digest in examples;
- persistent named volumes;
- healthchecks where the selected image supports them;
- environment-variable overrides for ports and paths;
- administrative API not exposed publicly by default;
- published repository and administrative API treated separately.

## Portainer

Portainer is a first-class use case for deployment documentation.

Avoid Compose tricks that require local preprocessing. A user should be able to paste/import the YAML, set the documented variables, and deploy it.

The dashboard itself does not need Portainer credentials and does not manage the Portainer stack.

## Local deployment

For a local-only API:

```text
127.0.0.1:<api-port> → Aptly API
```

The public repository endpoint is separate and can be exposed to the LAN or Internet as appropriate.

## Remote deployment

A raw Aptly API should not be exposed directly to the Internet. Aptly's own documentation notes that its REST API has no built-in authentication/protection and recommends putting it behind an HTTP proxy that adds HTTPS and authentication.

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

The dashboard connection profile supports the credentials used by that proxy.

The public APT repository URL remains independent from the administrative API URL.

## What the app does not do

The desktop application will not:

- create containers;
- stop/start containers;
- assume Docker is installed;
- require access to the Docker daemon;
- manage Portainer;
- manage a reverse proxy;
- publish or maintain a custom Aptly image.

This separation keeps the client useful in more environments and keeps responsibility clear: Aptly upstream owns Aptly; this project owns the dashboard.
