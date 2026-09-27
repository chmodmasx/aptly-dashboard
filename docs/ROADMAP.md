# Roadmap

## M0 — UI baseline

- Tauri 2 + React + TypeScript + Vite.
- shadcn/`dashboard-01` visual direction via `tauri-ui` conventions.
- Mock data and navigation for Aptly concepts.

## M1 — Connection and compatibility foundation

- Rust-side HTTP client.
- Connection profiles.
- `GET /api/version` handshake.
- Official support target: Aptly 1.6.3.
- Capability model and feature gates.
- Timeouts, structured errors and reconnect behavior.
- Real connection state in the UI.
- Initial API contract-test harness.

## M2 — Reference deployment

- Add optional `deploy/compose.yaml`.
- Keep it Docker Compose and Portainer friendly.
- Project-owned Aptly 1.6.3 image only if needed.
- Persistent named volumes.
- Separate published-repository HTTP service.
- Safe local API binding.
- Remote/reverse-proxy documentation.
- CI smoke test for the reference stack.

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

## M7 — Distribution

- GitHub Actions CI.
- Tauri application releases.
- Linux packaging first.
- GHCR reference-server image releases if the project owns one.
- Other desktop platforms after behavior is validated.

## Later

- Multiple connection profiles.
- External storage backends in the UI.
- Advanced authenticated proxy integrations.
- Multiple Aptly instances open at once.
