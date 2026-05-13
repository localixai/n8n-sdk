---
name: n8n-sdk
description: Programmatically manage n8n as a backend control plane using the n8n SDK. Use when creating, updating, activating, deactivating, transferring, or deleting workflows, credentials, and variables from code.
license: MIT
compatibility: Requires Node.js, npm, n8n Public API access, and network access to the n8n instance.
metadata:
  author: localixai
  repository: localixai/n8n-sdk
---

# n8n SDK Workflow Backend

Use this skill when n8n should be managed as backend infrastructure from code (not manual UI clicks and not one-off MCP-only actions).

## Installation

Install the SDK in a project:

```bash
npm i @localixai/n8n-sdk
```


Trigger phrases:

- "create workflow from code"
- "update workflow JSON"
- "activate/deactivate workflow"
- "rotate credential"
- "use n8n as backend/control plane"

## Prerequisites

1. Ensure this package is installed in the current project: `@localixai/n8n-sdk`.
2. Ensure `N8N_BASE_URL` and `N8N_API_KEY` are available for runtime operations.
3. Verify n8n API reachability before making changes.

## Critical rules

1. Prefer typed SDK methods over raw HTTP calls.
2. Use idempotent update flow: `get -> merge -> put`.
3. Do not assume feature parity across n8n plans; variables endpoints can be license-gated.
4. Credential read endpoints do not expose secret values; design flows accordingly.
5. After code changes, run validation (`typecheck`, tests, or smoke checks if available).
6. Never delete old credentials before workflow validation succeeds with the new credential.

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

## Reference loading strategy

Load only the file needed for the current task:

1. `references/workflow-lifecycle.md` for create/update/activate/deactivate/rollback workflow tasks.
2. `references/credential-and-variables.md` for credential rotation and variable handling.
3. `references/validation-and-recovery.md` for post-change validation and failure triage.

## Validation loop

1. Run code changes.
2. Validate with project checks.
3. If runtime flow was changed, execute a minimal live API call.
4. Fix and re-validate until checks pass.

## Operational output format

When executing a task, return this structure:

1. Goal
2. Planned API operations
3. Applied changes
4. Validation results
5. Rollback status (or "not needed")

## Notes and gotchas

- Credential read endpoints do not expose secret values.
- Some variables endpoints can be license-gated by n8n plan.
- Always use typed SDK methods instead of raw ad-hoc HTTP when possible.
- Prefer idempotent update flows (`get -> merge -> put`).
