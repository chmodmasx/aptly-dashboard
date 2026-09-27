# Upgrades and data safety

## Principle

Images are replaceable; user repository data is not.

Aptly Dashboard must treat an Aptly-version change as a data migration event, not as an ordinary container restart.

## Release identity

Each stack release should record:

~~~
stack version
dashboard version
expected Aptly version
dashboard schema version
~~~

Example:

~~~
Stack 0.3.0
Dashboard 0.3.0
Aptly 1.6.3
~~~

A later Dashboard release can still use the same Aptly version:

~~~
Stack 0.4.0
Dashboard 0.4.0
Aptly 1.6.3
~~~

Aptly only changes when we intentionally validate a new version:

~~~
Stack 0.5.0
Dashboard 0.5.0
Aptly 1.6.4
~~~

## Update classes

### Dashboard-only update

Aptly version unchanged.

~~~
pull dashboard image
recreate dashboard/repo-server if needed
reuse persistent data
do not migrate Aptly
~~~

### Container refresh, same Aptly version

The Aptly provider image/revision changes but reports the same supported Aptly version.

Persistent data remains mounted.

The new container must pass health/readiness/version checks before normal operation resumes.

### Aptly version update

Aptly itself changes.

This requires a pre-upgrade backup and validation gate.

## Pre-upgrade backup

Before an Aptly version change, capture:

- Aptly database/root state;
- package pool;
- publication tree where required;
- signing-key state;
- Dashboard metadata;
- the currently deployed image/version manifest.

A backup should be identifiable, for example:

~~~
2026-09-27-before-aptly-1.6.4/
├── aptly-data.tar.zst
├── dashboard-data.tar.zst
└── manifest.json
~~~

Exact storage mechanics may use Docker volumes or a configurable host backup directory.

## Upgrade lock

While an Aptly version migration is in progress, the Dashboard must prevent conflicting write operations.

Read-only status may remain available where safe.

## Validation after start

At minimum validate:

- Aptly process healthy;
- GET /api/ready;
- GET /api/version;
- repository listing;
- snapshot listing;
- publication listing;
- storage endpoint;
- capability set required by the Dashboard release.

Only then mark the upgrade complete.

## Failed-upgrade recovery

There is no general user-facing downgrade feature.

However, if the upgrade fails before it is accepted as complete, the product should protect user data by restoring the pre-upgrade backup and returning the stack to a known-safe state.

This is recovery from a failed migration, not a promise that arbitrary future Aptly data can be downgraded.

## After successful upgrade

Once a migration is accepted as successful:

- the new Aptly version becomes authoritative;
- no supported downgrade path is promised;
- the pre-upgrade backup is retained according to the configured retention policy;
- later backups use the new version in their manifest.

## Retention

Backup retention must be configurable.

A safe initial policy can keep:

- the most recent pre-upgrade backup;
- a small number of previous upgrade backups;
- manually protected backups indefinitely.

Automatic cleanup must never delete the only known-good pre-upgrade backup while an upgrade is still pending.
