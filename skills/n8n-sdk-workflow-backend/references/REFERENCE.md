# Workflow Backend Reference

## Primary goal

Use the SDK to treat n8n as managed backend infrastructure.

## Canonical flow

1. Create client with `createClient(createConfig(...))`.
2. Create or resolve credentials needed by workflow nodes.
3. Create or resolve variables for secret-like values when supported.
4. Build workflow JSON with typed SDK calls.
5. Create workflow with `Workflow.postWorkflows()`.
6. Fetch current workflow before updates.
7. Update with `Workflow.putWorkflowsById()` using merged payload.
8. Activate with `Workflow.postWorkflowsByIdActivate()`.
9. Deactivate or delete when rolling back.

## Gotchas

- n8n Public API does not expose credential secret values on read.
- Variables can be license-gated depending on plan.
- Some endpoints differ by instance capability; code should tolerate unavailable features.
- Prefer `get -> merge -> put` instead of blind overwrite updates.

## Repo examples

- `docs/examples/backend-control-plane.ts`
- `docs/examples/sdk-simple-workflow-demo.ts`
- `tests/control-plane.smoke.test.ts`
