# Roadmap

## M0 — UI and Aptly client prototype

Completed baseline:

- React/TypeScript/Vite/shadcn-style UI;
- original Tauri wrapper;
- Rust Aptly HTTP client;
- GET /api/version handshake;
- Aptly 1.6.3 compatibility target;
- capability probes;
- frontend and Rust CI.

The Tauri runtime is now considered a prototype/transition layer, not the primary product architecture.

## M1 — Web backend foundation

- extract/reuse Aptly client logic outside Tauri commands;
- add Rust HTTP backend;
- make React call the backend over same-origin HTTP;
- health/readiness endpoints for the Dashboard;
- persistent Dashboard configuration;
- remove the in-app updater concept;
- keep Aptly compatibility enforcement in the backend.

## M2 — Docker / Portainer stack

- Dashboard image;
- operator-selected APTLY_IMAGE;
- Aptly internal network contract;
- dashboard-data, aptly-data and backup-data persistence;
- repo-server service;
- no Docker socket;
- Compose file usable directly in Portainer;
- first end-to-end clean deployment.

## M3 — Multi-repository public endpoints

- one Aptly instance with many repositories/publications;
- hostname to Aptly publication-prefix metadata;
- one repo-server serving many public domains;
- endpoint verification;
- Nginx Proxy Manager guidance without NPM API integration.

## M4 — Real Aptly read path

- repositories;
- packages;
- mirrors;
- snapshots;
- publications;
- tasks;
- storage;
- signing-key information supported by Aptly.

## M5 — Real Aptly write path

- create/edit/delete repositories;
- package upload/import/remove;
- mirrors;
- snapshots;
- publications;
- destructive-action confirmations.

## M6 — Signing and publication policy

- signing workflows supported by Aptly;
- secure signing secret handling;
- testing/stable workflow;
- PASS may progress to Testing;
- Stable requires explicit confirmation.

## M7 — Upgrade safety

- stack version manifest;
- pre-upgrade backups;
- upgrade lock;
- Aptly-version migration checks;
- failed-upgrade recovery;
- configurable backup retention;
- no supported downgrade after successful migration.

## M8 — Compatibility and releases

- disposable Aptly API contract tests;
- expand compatible Aptly versions only after CI validation;
- versioned Dashboard container releases;
- pinned example stack manifests;
- release notes describing whether Aptly changes.

## Later

- optional external Aptly mode;
- multiple Aptly instances;
- alternative storage backends;
- optional desktop wrapper if there is a concrete use case.
