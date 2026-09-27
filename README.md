# Aptly Dashboard

Desktop repository-management application built with Tauri 2 for Aptly.

The current codebase is the UI baseline. It uses React, TypeScript, Vite and shadcn-style components, following the desktop conventions of [`agmmnn/tauri-ui`](https://github.com/agmmnn/tauri-ui) and its `dashboard-01` starter approach.

## Current state

- functional desktop UI with mock data;
- Dashboard, Repositories, Packages, Snapshots, Publications, Mirrors, Tasks, Storage and Settings views;
- light/dark theme;
- quick-create UI (`Ctrl/Cmd + N`);
- development debug panel (`Ctrl/Cmd + D`);
- no real Aptly connection yet.

## Planned runtime model

The default mode will manage its own local Aptly stack through Docker Compose. The end-user infrastructure requirement is intended to be **Docker + Compose v2**, not a host Aptly installation.

The desktop app will orchestrate Docker from its Rust/Tauri backend and use Aptly's REST API for repository operations. Docker containers will not receive the host Docker socket.

See:

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/ROADMAP.md`](docs/ROADMAP.md)

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

## Design origin

`tauri-ui` scaffolds upstream shadcn and Tauri rather than maintaining a large forked UI template. This repository follows the same principle: keep the UI close to upstream component conventions and put Aptly-specific behavior in our own application layers.

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) for attribution notes.
