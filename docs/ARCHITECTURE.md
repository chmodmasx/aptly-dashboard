# Architecture plan

## Product goal

`aptly-dashboard` is a Tauri desktop application for managing Aptly repositories through a graphical interface. The default deployment model is a **managed local Aptly stack**: the application provisions and controls its own Docker Compose stack while the frontend talks to Aptly through its REST API.

The project should also leave room for an **external Aptly mode** later, for users who already run Aptly elsewhere.

## Runtime requirements

For the managed mode, the only infrastructure prerequisite should be:

- Docker Engine or Docker Desktop;
- Docker Compose v2 (`docker compose`);
- permission for the current user to talk to the Docker daemon.

Node, Rust, Aptly, nginx, GPG and other build/runtime dependencies should not be required from the end user once packaged releases exist.

## High-level design

```text
Tauri desktop app
  ├─ React/shadcn UI
  ├─ Aptly REST client
  └─ Rust orchestration layer
       ├─ Docker detection / health
       ├─ docker compose lifecycle
       ├─ fixed administrative actions
       └─ local settings / secrets integration

Docker Compose project: aptly-dashboard
  ├─ aptly
  │    ├─ aptly 1.6.3+
  │    ├─ REST API :8080
  │    └─ persistent Aptly data
  └─ repo-server
       └─ serves Aptly's published repository tree read-only
```

## Docker ownership model

The application should **not mount `/var/run/docker.sock` into any container**. The Tauri process already runs on the host, so Docker should be controlled from Rust using the installed `docker` CLI with a narrow, explicit command surface.

The frontend must never execute arbitrary Docker commands. It should call Tauri commands such as:

- `docker_status`
- `stack_status`
- `stack_start`
- `stack_stop`
- `stack_restart`
- `stack_logs`
- `stack_pull`
- `stack_upgrade`
- `stack_backup`
- `stack_restore`

The Rust layer should build argument arrays directly instead of assembling shell strings.

## Managed Compose stack

### `aptly`

One process per container. The Aptly container should run the API directly, for example:

```text
aptly api serve -listen=:8080
```

It owns the writable Aptly data volume and configuration.

The image should be maintained by this project rather than depending on the older all-in-one `aptly-dev/docker-aptly` image. Production releases should use a versioned image from GHCR, built by GitHub Actions and pinned by version (and eventually digest). Development may keep a local Dockerfile build path.

### `repo-server`

A separate small nginx container serves only the published Apt repository tree from the Aptly data volume as read-only.

This avoids running nginx, supervisor and Aptly API in one container and keeps each service's responsibility clear.

## Networking and security defaults

The Aptly REST API is unauthenticated by default, so managed mode must keep it private:

- API bind: `127.0.0.1` only;
- default host API port: configurable, initially `18080`;
- repository HTTP server: localhost by default, initially `18081`;
- LAN/public exposure must be an explicit user action;
- no Docker socket inside the stack;
- no arbitrary shell exposed to the frontend.

The application should detect port conflicts before starting the stack.

## Persistence

Initial implementation should use Docker named volumes because they avoid UID/GID and cross-platform bind-mount problems.

Suggested volumes:

- `aptly-data` — database, package pool, snapshots and published tree;
- `aptly-gpg` — signing keyring, if separated from the main root.

Backups should be a first-class feature. Before any migration that can alter persistent state, the application should offer or automatically create a backup archive.

A later advanced setting can support a user-selected bind-mount directory.

## GPG signing

Publishing and signing need their own onboarding flow:

1. create a new signing key, or
2. import an existing private key.

Key material must live in persistent storage. Passphrases must not be written to Compose files or plaintext application settings. When secret storage is implemented, use the operating system's credential/keyring facilities through the Tauri side.

Repository creation, mirrors and snapshots should remain usable before a signing key exists; publishing should clearly indicate when signing configuration is incomplete.

## Aptly API boundary

Normal repository operations should go through Aptly's REST API:

- repositories;
- packages/uploads;
- mirrors;
- snapshots and diffs;
- publishing;
- tasks;
- storage/health where available.

Docker orchestration is only for lifecycle and infrastructure. We should not implement repository management by running Aptly CLI commands when an API endpoint exists.

A small number of setup/recovery operations may require `docker exec`; those must be fixed backend actions, not free-form commands.

## Application lifecycle

Closing the GUI should **not** stop Aptly by default. A repository server may need to remain available without the dashboard open.

Default behavior:

- opening the app: detect Docker and the managed stack;
- if the stack exists and is stopped: show a Start action;
- if it does not exist: show first-run setup;
- closing the app: leave containers running;
- explicit Stop control: stops services but keeps all data;
- destructive Reset: separate flow with typed confirmation and backup warning.

## First-run flow

1. Check Docker executable.
2. Check Docker daemon access.
3. Check Compose v2.
4. Check available ports and disk space.
5. Select managed mode (default) or, later, external mode.
6. Pull the pinned container images.
7. Create volumes and start the stack.
8. Wait for Aptly health/API readiness.
9. Offer GPG signing setup.
10. Enter the dashboard.

Errors should be shown in normal language with an expandable technical detail/log section.

## Versioning and upgrades

Three versions should be treated separately:

- desktop application version;
- managed-stack schema/config version;
- Aptly image/version.

The Compose/image version must not silently follow `latest`. Upgrades should be explicit and reproducible.

Before a state-affecting upgrade:

1. verify current health;
2. create backup;
3. pull the target image;
4. stop only what is required;
5. start the new stack;
6. verify API and repository availability;
7. preserve a documented rollback path.

## Development layout

Proposed repository layout:

```text
aptly-dashboard/
├── src/                    # React UI
├── src-tauri/              # Rust/Tauri backend
├── docker/
│   ├── compose.yaml
│   ├── aptly/
│   │   ├── Dockerfile
│   │   └── aptly.conf
│   └── nginx/
│       └── default.conf
├── docs/
│   ├── ARCHITECTURE.md
│   └── ROADMAP.md
└── .github/workflows/
    ├── ci.yml
    ├── release.yml
    └── container.yml
```

The Docker files can be bundled into the Tauri application as resources for packaged builds. During development, the repository copies are the source of truth.

## Deliberately deferred

Do not implement these in the first Docker milestone:

- remote Docker hosts;
- Kubernetes;
- multiple managed Aptly instances;
- public Internet exposure wizard;
- automatic reverse-proxy/DNS management;
- S3/GCS/JFrog publishing UI;
- multi-user authentication.

The first milestone is one reliable local managed instance with persistent data, safe lifecycle controls and full Aptly API integration.
