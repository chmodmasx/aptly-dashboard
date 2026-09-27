# Architecture

## Product boundary

Aptly Dashboard is a web administration layer for Aptly.

The project owns:

- the Dashboard frontend;
- the Dashboard Rust backend;
- compatibility checks;
- endpoint/publication metadata;
- the repository-serving integration;
- upgrade orchestration and backup policy for the reference stack.

The project does **not** own Aptly itself.

We do not fork, patch or publish a custom Aptly build/image.

## Primary deployment

~~~
                    external reverse proxy
                    (NPM, Caddy, nginx...)
                              │
                 ┌────────────┴────────────┐
                 ▼                         ▼
             dashboard                 repo-server
                 │                         │
                 │ Aptly REST API          │ published files
                 ▼                         ▼
               aptly ───────────────► aptly-data
                 │
                 └──────────────────► signing/data state

dashboard ────────────────────► dashboard-data
upgrade workflow ─────────────► backup-data
~~~

The normal user deployment is one Compose/Portainer stack with several containers, not one giant multi-process container.

## Services

### dashboard

Our application image.

Responsibilities:

- React UI;
- Rust HTTP backend;
- Aptly REST client;
- version/capability checks;
- repository/publication management;
- public-endpoint metadata;
- upgrade status and backup workflow;
- authentication/session layer for the Dashboard itself.

The production web UI talks only to the Dashboard backend.

### aptly

An operator-selected image containing Aptly.

Requirements are defined by an image contract, not by ownership of the image.

The initial compatibility target is Aptly **1.6.3**.

The Dashboard always verifies the live server through GET /api/version and capability probes.

### repo-server

Serves Aptly's published repository tree read-only.

One server can expose many repositories/publication prefixes.

The planned implementation may use the same Aptly Dashboard image in a separate repo-server mode so the project ships one application image while keeping processes isolated.

It must never modify Aptly's package/database state.

## One Aptly, many repositories

Aptly repositories, Aptly publications and public hostnames are separate concepts.

Example:

~~~
local repository      publication prefix       public endpoint
supra-stable          supralinux                repo.supralinux.com
colegio               colegio                   repo.colegio.com
my-app                my-app                    packages.example.com
~~~

A single Aptly instance may contain all of them.

Conceptually its published tree can look like:

~~~
public/
├── supralinux/
│   ├── dists/
│   └── pool/
├── colegio/
│   ├── dists/
│   └── pool/
└── my-app/
    ├── dists/
    └── pool/
~~~

The Dashboard stores endpoint metadata that associates a hostname with a publication prefix.

The external reverse proxy only forwards the hostname to repo-server; it does not need a separate Aptly container for each repository.

## Reverse proxy boundary

TLS/DNS/public ingress stays outside the application stack.

For example with Nginx Proxy Manager:

~~~
aptly.supralinux.com
    → dashboard

repo.supralinux.com
    → repo-server

repo.colegio.com
    → repo-server
~~~

The Dashboard does not manage NPM and never needs NPM credentials.

It may later generate configuration guidance and verify that configured public URLs are reachable and valid.

## Aptly compatibility

Compatibility is determined by:

1. reported Aptly version;
2. required endpoint/capability probes;
3. automated compatibility tests for versions we officially support.

Initial target: Aptly 1.6.3.

The UI must use backend capabilities rather than scattered frontend version comparisons.

## Aptly image contract

The reference Compose stack will receive the Aptly image from configuration, for example:

~~~
APTLY_IMAGE=<operator-selected image>
~~~

The image must satisfy the documented runtime contract for the stack, including:

- Aptly API reachable from the internal Docker network;
- persistent Aptly root mounted outside the container filesystem;
- published files stored in a persistent/shared location;
- configured signing material persisted outside the ephemeral container;
- a version compatible with the Dashboard release.

The exact provider/image can change without changing the Dashboard architecture.

## Persistent state

No important user state may depend on an ephemeral container layer.

Logical persistent areas:

~~~
aptly-data
dashboard-data
backup-data
~~~

Signing-key storage belongs to the Aptly persistent backup scope, whether the selected image stores it inside the Aptly root or in a dedicated persistent path.

The repo-server receives only the published portion it needs, read-only where possible.

## Updates

Docker/Portainer owns image deployment.

The application does not self-update.

A stack release records at least:

~~~
stack version
dashboard image version
expected/supported Aptly version
dashboard data schema version
~~~

Dashboard-only image updates must not restart or migrate Aptly unnecessarily.

A stack release that changes Aptly version must run the pre-upgrade backup/recovery procedure defined in UPGRADES.md.

## No supported downgrade path

After an Aptly upgrade has completed successfully, the product does not promise a downgrade to an older Aptly version.

This is separate from failed-upgrade recovery: if an upgrade fails before completion, the system may restore the pre-upgrade backup to protect user data.

## Security

- no Docker socket mounted into application containers;
- no privileged containers;
- Aptly REST API stays on the private Compose network by default;
- external access to the Dashboard goes through HTTPS/authentication;
- public APT repository content is separate from the administrative API;
- destructive Aptly actions require explicit confirmation;
- secrets never belong in frontend localStorage.

## Current transition

The current repository still contains the initial Tauri prototype and its Rust connection implementation.

The next code refactor will:

1. extract/reuse the Aptly client logic;
2. expose it through a Rust web backend;
3. make React call that backend;
4. add the Docker stack;
5. leave Tauri, if retained at all, as an optional future wrapper rather than the core runtime.
