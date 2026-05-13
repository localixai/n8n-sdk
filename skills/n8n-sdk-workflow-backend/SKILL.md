---
name: n8n-sdk-workflow-backend
description: Programmatically manage n8n as a backend control plane using the n8n SDK. Use when creating, updating, activating, deactivating, transferring, or deleting workflows, credentials, and variables from code.
license: MIT
compatibility: Requires Node.js, npm, n8n Public API access, and network access to the n8n instance.
metadata:
  author: localixai
  repository: localixai/n8n-sdk
---

# n8n SDK Workflow Backend

Use this skill when you need deterministic, code-driven n8n automation management instead of one-off manual UI operations.

## When to use

- You need to create or update workflows from code.
- You need to manage credentials and variables from API.
- You need activation/deactivation and lifecycle automation.
- You need repeatable deployment and testable backend operations.

## Standard procedure

1. Configure the SDK client with `N8N_BASE_URL` and `N8N_API_KEY`.
2. Create or update credentials required by workflow nodes.
3. Create or update variables for secret-like runtime values.
4. Create workflow JSON with node credentials references.
5. Update workflow definitions via API (`putWorkflowsById`).
6. Activate/deactivate as needed.
7. Run smoke checks and cleanup for temporary artifacts.

## Canonical examples

- `docs/examples/backend-control-plane.ts`
- `docs/examples/sdk-simple-workflow-demo.ts`
- `tests/control-plane.smoke.test.ts`

Load `references/REFERENCE.md` when you need the operational playbook or endpoint gotchas.

## Notes and gotchas

- Credential read endpoints do not expose secret values.
- Some variables endpoints can be license-gated by n8n plan.
- Always use typed SDK methods instead of raw ad-hoc HTTP when possible.
- Prefer idempotent update flows (`get -> merge -> put`).
