# Architecture

## Product boundary

`aptly-dashboard` is a desktop client for Aptly. It is **not** a Docker manager and does not own the lifecycle of the Aptly server.

The dashboard should work with any deployment that exposes a compatible Aptly REST API, regardless of whether Aptly runs:

- directly on a host;
- under systemd;
- in Docker/Podman;
- in Portainer;
- in a VM;
- on a remote server.

The project may ship deployment examples, including Docker Compose, but those remain optional.

## High-level design

```text
React / shadcn UI
        │
        │ typed Tauri commands
        ▼
Tauri / Rust backend
        │
        ├─ connection profiles
        ├─ credentials / secret handling
        ├─ HTTP timeouts and TLS policy
        ├─ Aptly version + capability checks
        └─ Aptly API client
                 │
                 │ HTTP(S)
                 ▼
        Compatible Aptly REST API
                 │
                 └─ repositories / packages / mirrors /
                    snapshots / publish / tasks / storage
```

## Why the Rust backend owns HTTP

The webview should not call Aptly directly.

Using Rust as the transport layer avoids depending on browser CORS behavior and gives us a single location for:

- URL validation;
- TLS handling;
- authentication;
- timeouts;
- retries where safe;
- response parsing;
- Aptly version checks;
- compatibility feature gates;
- structured error messages.

Credentials must not be stored in browser `localStorage`.

## Connection profiles

A profile should contain non-secret metadata such as:

- profile name;
- Aptly API base URL;
- optional public repository URL;
- authentication mode;
- TLS verification policy;
- user-facing notes.

Potential authentication modes:

- none;
- HTTP Basic;
- Bearer token;
- custom header.

Aptly itself does not provide application authentication for its REST API, so remote deployments should place it behind a suitable authenticated reverse proxy.

Secrets should eventually use an OS-backed secure store from the Tauri side.

## Connection handshake

Every new connection performs a handshake before normal features are enabled.

Minimum sequence:

1. normalize and validate the configured URL;
2. request `GET /api/version`;
3. parse the reported Aptly version;
4. compare it against the compatibility policy;
5. probe required endpoints/capabilities;
6. return a structured connection status to the UI.

Example version response from Aptly:

```json
{"Version":"1.6.3"}
```

The version is necessary but not sufficient. Feature availability should also be represented as capabilities.

## Capability model

The UI should not scatter version comparisons throughout components.

The backend should expose a capability object, for example:

```text
AptlyCapabilities
├─ repository_list
├─ repository_edit
├─ package_upload
├─ mirror_edit
├─ snapshot_diff
├─ storage_usage
├─ gpg_key_api
├─ task_api
└─ multi_signing_keys
```

Pages and actions use capabilities, not hard-coded `if version >= ...` checks.

This lets us support patch releases and later Aptly versions without turning the frontend into a version matrix.

## API boundary

Normal repository operations use Aptly REST endpoints whenever available:

- repositories;
- package search/upload/import/remove;
- mirrors;
- snapshots and diffs;
- publishing;
- tasks;
- GPG key operations;
- storage information.

The desktop application should not SSH into the server or run Aptly CLI commands remotely.

If a useful Aptly operation is CLI-only, it should initially be marked unsupported rather than introducing a generic remote-shell path. An explicit extension mechanism can be designed later if there is a strong use case.

## Error model

Errors returned to React should be structured:

```text
kind
message
operation
http_status?
aptly_error?
retryable
technical_details?
```

The normal UI shows a concise explanation. Technical details are available on demand.

Network failures, authentication failures, incompatible versions and Aptly operation errors must be distinguishable.

## Security defaults

For a local Aptly deployment, binding the raw API to localhost is acceptable.

For remote access:

- use HTTPS;
- do not expose an unauthenticated raw Aptly API directly to the Internet;
- place the API behind a reverse proxy or gateway with authentication;
- keep repository HTTP exposure separate from administrative API exposure.

The dashboard should support authenticated reverse proxies without requiring a special Aptly build.

## Optional deployment assets

The repository will provide a reference deployment under `deploy/`.

Proposed structure:

```text
deploy/
├── compose.yaml
├── .env.example
├── aptly/
│   └── aptly.conf
├── repo-server/
│   └── default.conf
└── README.md
```

The Compose stack is designed to be:

- usable with `docker compose`;
- pasteable/importable into Portainer with minimal changes;
- based on explicit image tags;
- persistent through named volumes;
- free of host Docker-socket mounts;
- configurable through environment variables.

The dashboard itself does not start, stop or inspect this stack.

## Published repository serving

The administrative Aptly API and the published APT repository are separate concerns.

A reference Compose deployment may contain:

```text
aptly
  └─ REST API

repo-server
  └─ read-only HTTP serving of the published repository tree
```

Users with an existing nginx/Caddy/Traefik setup may ignore the included repository server and publish through their own infrastructure.

## Compatibility boundary

Initial official target:

- Aptly 1.6.3

See `COMPATIBILITY.md` for the policy.

When adding support for another version, CI should run API contract tests against that version before the matrix is expanded.

## Deliberately deferred

- Docker lifecycle management from Tauri;
- remote shell/SSH execution;
- Kubernetes orchestration;
- automatic DNS/reverse-proxy setup;
- multi-user server component;
- arbitrary command execution;
- automatic public Internet exposure.

The first integration milestone is a reliable client connection to one compatible Aptly REST API.
