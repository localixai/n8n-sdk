# Workflow Lifecycle Playbook

## Use when

- Creating new workflows from code.
- Updating existing workflows safely.
- Activating/deactivating workflows.
- Rolling back broken changes.

## Minimal create flow (TypeScript)

```ts
import { createClient, createConfig, Workflow } from '@localixai/n8n-sdk';

const client = createClient(
  createConfig({
    baseUrl: process.env.N8N_BASE_URL!,
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY! },
  }),
);

const created = await Workflow.postWorkflows({
  client,
  body: {
    name: 'SDK Managed Workflow',
    nodes: [],
    connections: {},
  },
});

if (created.error) throw created.error;
const workflowId = created.data?.id;
```

## Safe update flow

```ts
const current = await Workflow.getWorkflowsById({
  client,
  path: { id: workflowId! },
});
if (current.error || !current.data) throw current.error ?? new Error('Workflow not found');

const next = {
  ...current.data,
  name: `${current.data.name} (updated)`,
};

const updated = await Workflow.putWorkflowsById({
  client,
  path: { id: workflowId! },
  body: next,
});
if (updated.error) throw updated.error;
```

## Activation / deactivation

```ts
await Workflow.postWorkflowsByIdActivate({ client, path: { id: workflowId! } });
await Workflow.postWorkflowsByIdDeactivate({ client, path: { id: workflowId! } });
```

## Rollback protocol

1. Keep previous workflow payload before update.
2. If deploy is broken, deactivate workflow.
3. Restore payload with `putWorkflowsById`.
4. Re-activate only after verification read succeeds.
