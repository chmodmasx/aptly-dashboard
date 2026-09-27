# Deployment

## Primary model

Aptly Dashboard is distributed primarily as a Docker Compose / Portainer stack.

~~~
services:
  dashboard
  aptly
  repo-server
~~~

This is one product stack, but each responsibility stays in its own container.

## Image ownership

The project publishes only Aptly Dashboard artifacts.

It does not maintain an Aptly image.

The operator supplies the Aptly image through deployment configuration. The exact image is acceptable only if the running server passes the Dashboard's version/capability checks.

Never use a floating latest tag in a documented production deployment.

Prefer an explicit tag and, when practical, an immutable digest.

## Compose goals

The reference deployment must work well in docker compose and Portainer Stacks.

Rules:

- no Docker socket;
- no privileged mode;
- persistent volumes;
- private internal network;
- explicit image versions;
- healthchecks;
- restart policies;
- environment-variable configuration;
- no dependency on host Aptly installation;
- no dependency on host Node/Rust toolchains.

## Reverse proxy

The stack does not manage DNS or TLS.

An external reverse proxy such as Nginx Proxy Manager can publish:

~~~
aptly.example.com  → dashboard
repo.example.com   → repo-server
repo2.example.com  → repo-server
~~~

Multiple public repository domains may target the same repo-server.

The Dashboard keeps the logical association between hostname and Aptly publication prefix.

## Multi-repository example

One Aptly service:

~~~
aptly
├── prefix: supralinux
├── prefix: colegio
└── prefix: my-app
~~~

One repository server:

~~~
repo-server
├── repo.supralinux.com  → supralinux
├── repo.colegio.com     → colegio
└── packages.example.com → my-app
~~~

No extra Aptly container is required when a new repository/domain is added.

## Persistent data

The deployment must persist at least:

- Aptly database/package/publication state;
- signing-key state used by Aptly;
- Dashboard metadata/configuration;
- upgrade backups.

Deleting/recreating containers must not delete this state.

Normal docker compose down guidance must avoid -v unless the user explicitly wants destructive reset.

## Dashboard updates

For a Dashboard-only release:

~~~
pull new dashboard image
recreate dashboard-related containers
reuse existing volumes
leave Aptly data unchanged
~~~

The user/operator decides when to deploy the new image.

There is no in-app updater.

## Aptly version updates

If a new supported stack release changes Aptly itself:

1. stop/lock new administrative operations;
2. create a pre-upgrade backup;
3. record current versions;
4. stop Aptly cleanly;
5. deploy the new Aptly image;
6. start and wait for health/readiness;
7. verify /api/version;
8. verify repositories/snapshots/publications;
9. mark the upgrade successful.

If validation fails, use failed-upgrade recovery from the pre-upgrade backup.

After a successful migration there is no supported downgrade promise.

See UPGRADES.md.

## Portainer

Portainer is a first-class deployment target.

The stack should expose important choices as environment variables, including eventually:

~~~
DASHBOARD_IMAGE
APTLY_IMAGE
APTLY_EXPECTED_VERSION
backup retention/settings
internal ports/paths required by the selected Aptly image
~~~

The Dashboard itself does not need Portainer credentials.

## Destructive reset

A complete reset is intentionally separate from normal redeployment.

It must clearly state that it removes:

- repositories;
- packages;
- snapshots;
- publications;
- signing state;
- Dashboard metadata;
- backups if explicitly selected.

Normal image updates must never perform that reset.
