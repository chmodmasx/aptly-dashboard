# Roadmap

## M0 — UI baseline

- Tauri 2 + React + TypeScript + Vite.
- shadcn/`dashboard-01` visual direction via `tauri-ui` conventions.
- Mock data and navigation for Aptly concepts.

## M1 — Managed Docker foundation

- Detect Docker Engine/Desktop and Compose v2.
- Add project-owned Aptly image and Compose stack.
- Persistent named volumes.
- Separate repository HTTP server.
- Rust-side lifecycle commands with no arbitrary shell.
- Health/readiness checks.
- First-run setup screen.

## M2 — Real Aptly read path

- API client and connection state.
- Dashboard metrics from Aptly.
- List repositories, packages, mirrors, snapshots, publications and tasks.
- Error handling and task progress.

## M3 — Real Aptly write path

- Create/edit/delete repositories.
- Package upload/import/remove.
- Mirror create/update/filter.
- Snapshot create/drop/diff/merge where supported.
- Publish/update/switch/drop.
- Destructive-action confirmations.

## M4 — Signing and publication

- Create/import GPG signing key.
- Secure passphrase handling.
- Signed publication workflow.
- Repository endpoint configuration.
- Explicit testing → stable promotion policy support.

## M5 — Backup, restore and upgrades

- Backup/export managed state.
- Restore flow.
- Pinned image upgrades.
- Pre-upgrade backup and post-upgrade validation.
- Rollback documentation and recovery tools.

## M6 — Distribution

- GitHub Actions CI.
- GHCR image builds for amd64/arm64.
- Tauri application releases.
- Linux packaging first; other desktop platforms after managed Docker behavior is validated.

## Later

- External Aptly server mode.
- Remote storage backends.
- Multiple instances/profiles.
- Optional LAN/public repository exposure helpers.
