# Release and Documentation Standard

This document defines the standard release process for this SDK.

## Branching and publishing model

- Main branch is the source of truth.
- npm publication is done by GitHub Actions workflow `publish.yml`.
- Publication is triggered by pushing a semantic version tag: `vX.Y.Z`.
- GitHub secret `NPM_TOKEN` must be an npm Automation Token for CI publishing.

## Standard update flow

1. Update API source: refresh `openapi.json` from upstream n8n OpenAPI source.

1. Regenerate SDK: run `npm run generate`.

1. Build artifacts: run `npm run build`.

1. Review repository documentation: ensure `README.md`, `docs/USAGE.md`, and examples reflect the current SDK state.

1. Run release gate checks: run `npm run release:check`. This executes typecheck, build, tests, and `npm pack --dry-run`.

1. Commit changes: commit generated and source changes.

1. Version bump: run `npm version patch` or `npm version minor` or `npm version major`.

1. Push to GitHub: run `git push origin main --follow-tags`.

1. Automated publish: tag push triggers `.github/workflows/publish.yml`, then package is published to npm with provenance enabled.

## Documentation standard

- Documentation lives in the repository.
- Keep `README.md`, `docs/USAGE.md`, `docs/RELEASE.md`, and `docs/examples/` aligned.
- `openapi.json` remains the canonical API source for generated SDK artifacts.

## Smoke testing policy

- `.github/workflows/smoke.yml` is manual only (`workflow_dispatch`).
- No GitHub env or secrets are required by default.
- Full integration smoke tests are expected to run locally using:
  - `N8N_BASE_URL`
  - `N8N_API_KEY`

## Local preflight commands

```bash
npm ci
npm run release:check
```

## Rollback note

If publish fails after a version tag is pushed:

1. Fix issues on main.
2. Bump to the next version.
3. Push new tag with `--follow-tags`.

Do not reuse an already published npm version.

## npm authentication note

- If GitHub Actions reaches `npm publish` and fails with `EOTP`, the token is not suitable for non-interactive CI publishing.
- Use an npm Automation Token, store it as `NPM_TOKEN`, and rerun with a new version tag.
