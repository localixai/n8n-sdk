---
name: n8n-sdk-release-docs
description: Execute the standardized release and documentation flow for n8n SDK, including OpenAPI regeneration, release checks, npm publish readiness, and repository documentation maintenance.
license: MIT
compatibility: Requires Node.js, npm, git, and access to GitHub and npm workflows.
metadata:
  author: localixai
  repository: localixai/n8n-sdk
---

# n8n SDK Release and Docs Ops

Use this skill when preparing releases, validating package readiness, and publishing API documentation.

## When to use

- You updated `openapi.json`.
- You regenerated SDK code.
- You need to run release gate checks before publish.
- You need to refresh repository documentation alongside SDK updates.

## Standard release flow

1. Refresh OpenAPI source and run `npm run generate`.
2. Run `npm run release:check`.
3. Verify repository docs are updated (`README.md`, `docs/USAGE.md`, `docs/RELEASE.md`).
4. Bump version using `npm version patch|minor|major`.
5. Push `main` and tags: `git push origin main --follow-tags`.
6. Confirm publish workflow completion: `.github/workflows/publish.yml`.

## References

- `docs/RELEASE.md`
- `.github/workflows/publish.yml`
- `.github/workflows/ci.yml`

## Quality gates

- Typecheck passes.
- Build passes.
- Unit tests pass.
- `npm pack --dry-run` succeeds.

Load `references/REFERENCE.md` when you need the exact release order or workflow file map.
