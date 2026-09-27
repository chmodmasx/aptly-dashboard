# Aptly compatibility policy

## Initial policy

Aptly Dashboard initially targets **Aptly 1.6.3**.

That means 1.6.3 is the version we design against, document, and test before calling a feature supported.

Current upstream Aptly exposes its version through:

```http
GET /api/version
```

with a response such as:

```json
{"Version":"1.6.3"}
```

## Compatibility states

| Aptly version | Status | Behavior |
| --- | --- | --- |
| 1.6.3 | Supported target | Full feature set once implemented and tested |
| 1.6.0–1.6.2 | Unsupported initially | Connection may be diagnosed, but full operation is not promised |
| future 1.6.x | Unverified until CI-tested | Do not silently assume compatibility |
| 1.7.x+ | Unsupported until evaluated | Requires contract/capability validation |
| < 1.6.0 | Unsupported | Too old for the initial API baseline |

## Why not declare all 1.6.x compatible immediately?

Several API capabilities evolved within the 1.6 series. Aptly 1.6.3 includes newer REST capabilities and response fields that are useful to this dashboard.

Declaring a broad range without testing would make the UI appear compatible while some actions could fail or return different shapes.

We will expand support only after automated contract tests pass.

## Version checks versus capabilities

Version checks are only the first gate.

The backend should produce an `AptlyCapabilities` object after probing the server. Features should be enabled from capabilities rather than repeated version comparisons in React.

This allows future states such as:

- 1.6.3: all currently implemented features;
- 1.6.4: same capabilities after CI validation;
- 1.7.0: partial support while changed endpoints are adapted.

## CI contract suite

Before adding a version to the supported matrix, CI should verify at minimum:

- `GET /api/version`;
- repository list/create/edit/delete;
- package upload/import/query/remove;
- mirror list/create/edit/update;
- snapshot list/create/diff/drop;
- publish list/create/update/switch/drop;
- tasks used by the UI;
- storage endpoints used by the UI;
- GPG endpoints used by the UI.

Tests must use disposable state.

## App behavior for unsupported versions

The app should not crash or blindly proceed.

It should show:

- reported Aptly version;
- compatibility status;
- detected capabilities;
- missing required capabilities;
- a clear option to disconnect/change profile.

A future advanced setting may allow an unsupported server in best-effort mode, but it should never masquerade as an officially supported configuration.
