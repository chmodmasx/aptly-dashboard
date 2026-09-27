# Aptly Dashboard

Desktop repository-management application built with Tauri 2 for Aptly.

The current codebase is the UI baseline. It uses React, TypeScript, Vite and shadcn-style components, following the desktop conventions of [`agmmnn/tauri-ui`](https://github.com/agmmnn/tauri-ui) and its `dashboard-01` starter approach.

## Product model

Aptly Dashboard is a **client for an Aptly REST API**. It does not require, own or automatically start Docker.

The user may run Aptly however they prefer:

- installed directly on Linux;
- as a systemd service;
- in Docker or Podman;
- from Portainer;
- on another machine;
- behind a reverse proxy.

This repository will also provide an **optional reference Docker Compose deployment** for users who want a ready-made stack. That Compose file is a deployment recipe, not a runtime dependency of the desktop application.

## Initial compatibility target

The first supported Aptly version is **1.6.3**.

The app verifies the server with `GET /api/version` before enabling normal operations. Other versions are not considered supported until they are covered by our compatibility tests.

See [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md).

## Current state

- functional desktop UI with mock data;
- Dashboard, Repositories, Packages, Snapshots, Publications, Mirrors, Tasks, Storage and Settings views;
- light/dark theme;
- quick-create UI (`Ctrl/Cmd + N`);
- development debug panel (`Ctrl/Cmd + D`);
- no real Aptly connection yet.

## Planned connection model

The Tauri/Rust layer will own network communication with Aptly. The React frontend will call typed Tauri commands rather than talking directly to Aptly from the webview.

This gives us:

- no browser CORS dependency;
- centralized timeouts and error handling;
- safer credential handling;
- version/capability checks in one place;
- the same behavior for local and remote Aptly servers.

## Development

```bash
npm install
npm run tauri dev
```

Frontend only:

```bash
npm install
npm run dev
```

## Stack

- Tauri 2
- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- shadcn-style components
- Lucide icons
- Recharts

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Compatibility](docs/COMPATIBILITY.md)
- [Deployment strategy](docs/DEPLOYMENT.md)
- [Roadmap](docs/ROADMAP.md)

## Design origin

`tauri-ui` scaffolds upstream shadcn and Tauri rather than maintaining a large forked UI template. This repository follows the same principle: keep the UI close to upstream component conventions and put Aptly-specific behavior in our own application layers.

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for attribution notes.
