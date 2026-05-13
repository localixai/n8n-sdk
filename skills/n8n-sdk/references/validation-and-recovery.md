# Validation and Recovery Playbook

## Use when

- Verifying changes after create/update/activation.
- Diagnosing failed API operations.
- Building a minimal smoke-check loop.

## Validation checklist

1. Every write operation returns without `error`.
2. Follow-up read confirms expected state.
3. Workflow active state matches deployment intent.
4. Credential references are valid after updates.
5. Capture status code + response body on failure.

## Minimal live check example

```ts
import { Workflow } from '@localixai/n8n-sdk';

const healthCheck = await Workflow.getWorkflows({
  client,
  query: { limit: 1 },
});

if (healthCheck.error) {
  throw healthCheck.error;
}
```

## Failure triage

1. Check if API key is valid and has required scope.
2. Check whether endpoint is available on this n8n plan.
3. Re-fetch the resource before retrying updates.
4. Apply rollback if active workflow behavior regresses.
5. Report exact API error details to user.
