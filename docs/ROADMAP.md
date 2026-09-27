# Roadmap

## M0 — UI baseline

- Tauri 2 + React + TypeScript + Vite.
- shadcn/`dashboard-01` visual direction via `tauri-ui` conventions.
- Mock data and navigation for Aptly concepts.

## M1 — Connection and compatibility foundation

Status: **in progress**

Implemented baseline:

- Rust-side HTTP client.
- Connection profile UI.
- `GET /api/version` handshake.
- Official support target: Aptly 1.6.3.
- Initial capability probes.
- HTTP Basic, Bearer and custom-header authentication.
- Timeouts and structured errors.
- Real connection state in Settings/sidebar.
- Rust unit tests for URL/version handling.
- GitHub Actions frontend + Rust checks.

Remaining:

- secure OS-backed credential persistence;
- reconnect/session restoration;
- broader contract-test harness against disposable Aptly 1.6.3;
- decide which capabilities are mandatory versus optional;
- harden proxy/TLS diagnostics.

## M2 — Reference deployment documentation

- Add optional `deploy/compose.yaml` only when backed by a responsibly chosen external Aptly image.
- Keep it Docker Compose and Portainer friendly.
- Do **not** publish or maintain our own Aptly image.
- Persistent volumes.
- Safe administrative API exposure.
- Nginx Proxy Manager/reverse-proxy example.
- Remote HTTPS/authentication documentation.
- CI smoke test for the documented deployment where practical.

## M3 — Real Aptly read path

- Dashboard metrics from Aptly.
- List repositories, packages, mirrors, snapshots, publications and tasks.
- Storage information.
- Read-only diagnostic views.

## M4 — Real Aptly write path

- Create/edit/delete repositories.
- Package upload/import/remove.
- Mirror create/update/filter.
- Snapshot create/drop/diff/merge where supported.
- Publish/update/switch/drop.
- Destructive-action confirmations.

## M5 — Signing and publication

- GPG key discovery/import/create flows as supported.
- Secure credential/passphrase handling on the client side.
- Signed publication workflow.
- Explicit testing → stable promotion policy support.

## M6 — Compatibility expansion

- Add additional Aptly releases to CI contract matrix.
- Expand support only when tests pass.
- Capability fallbacks for API differences where worthwhile.
- Document unsupported/partial features clearly.

## M7 — Application updater and distribution

- GitHub Actions CI.
- Signed Tauri application releases.
- Tauri updater plugin.
- `latest.json` in GitHub Releases.
- Settings → **Check for updates**.
- Optional automatic background checks; user-controlled installation.
- Linux packaging first.
- Other desktop platforms after behavior is validated.

## Later

- Multiple connection profiles.
- External storage backends in the UI.
- Advanced authenticated proxy integrations.
- Multiple Aptly instances open at once.
