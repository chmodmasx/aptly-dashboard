# Aptly Dashboard

Web-based repository manager for Aptly.

## Target product model

The primary deployment is a Docker Compose / Portainer stack:

~~~
aptly-dashboard stack
├── dashboard
├── aptly
└── repo-server
~~~

The project maintains **Aptly Dashboard**, not Aptly.

- dashboard uses our image.
- aptly uses an image selected by the operator.
- the Dashboard verifies the Aptly API version/capabilities before enabling normal operations.
- the first supported Aptly target is **1.6.3**.
- repo-server serves published APT content and can expose many repositories through different hostnames.

The operator chooses when to pull/redeploy newer images. There is no in-app self-updater in the Docker-first product.

## One Aptly, many repositories

A single Aptly instance can manage many local repositories and many published prefixes/distributions.

Example:

~~~
Aptly
├── supralinux
├── colegio
└── miapp
~~~

The same repo-server can expose them as:

~~~
repo.supralinux.com  → supralinux
repo.colegio.com     → colegio
packages.miapp.com   → miapp
~~~

An external reverse proxy such as Nginx Proxy Manager remains responsible for DNS/HTTPS and forwards those hostnames to the same repo-server.

## Persistent data

Container images are replaceable. User data is not.

The stack will keep persistent state outside the containers:

~~~
aptly-data
dashboard-data
backup-data
~~~

Updating the Dashboard does not replace Aptly data.

When a stack release changes the supported Aptly version, the upgrade flow must create a pre-upgrade backup before starting the new Aptly image.

There is no supported manual downgrade path after a successful Aptly migration. Failed-upgrade recovery uses the pre-upgrade backup.

See docs/UPGRADES.md.

## Aptly image policy

Aptly Dashboard does not publish or maintain a custom Aptly image.

The Compose deployment will accept an operator-selected Aptly image and pin it by tag/digest. The stack checks the reported version through GET /api/version.

A mismatched or unverified Aptly version is not treated as supported merely because the container starts.

See docs/COMPATIBILITY.md.

## Current state

The repository currently contains the original React/Tauri prototype plus the first Rust Aptly connection core.

That code is a transition baseline. The next implementation milestone moves the Rust Aptly client behind a web backend and makes the Docker/web stack the primary runtime.

## Target stack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- shadcn-style components
- Rust backend
- Docker Compose / Portainer
- Aptly REST API
- shared repository-serving component

## Documentation

- Architecture: docs/ARCHITECTURE.md
- Compatibility: docs/COMPATIBILITY.md
- Deployment: docs/DEPLOYMENT.md
- Upgrades and data safety: docs/UPGRADES.md
- Roadmap: docs/ROADMAP.md

## Design origin

The UI started from Tauri/shadcn conventions inspired by agmmnn/tauri-ui. The visual React layer remains reusable while the primary runtime moves to the web/Docker architecture.

See THIRD_PARTY_NOTICES.md for attribution notes.
