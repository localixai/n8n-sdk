# Release and Docs Reference

## Goal

Ship a validated npm package and synchronized GitHub Pages documentation.

## Release sequence

1. Refresh `openapi.json`.
2. Run `npm run generate`.
3. Update repository docs if behavior or examples changed.
4. Run `npm run release:check`.
5. Review `npm pack --dry-run` output.
6. Bump version with `npm version patch|minor|major`.
7. Push `main` and tags with `git push origin main --follow-tags`.
8. Confirm `.github/workflows/publish.yml` succeeds.

## Quality gates

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm pack --dry-run`

## Repo references

- `docs/RELEASE.md`
- `.github/workflows/publish.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/smoke.yml`
