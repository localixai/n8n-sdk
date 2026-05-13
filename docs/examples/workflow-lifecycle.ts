/**
 * Example: Full workflow lifecycle
 * Create -> Activate -> Execute -> Monitor -> Deactivate -> Delete
 */
import { createClient, createConfig } from '../../src/generated/client';
import { Workflow, Execution } from '../../src/generated/sdk.gen';

const client = createClient(
  createConfig({
    baseUrl: process.env.N8N_BASE_URL ?? 'http://localhost:5678/api/v1',
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY ?? '' },
  }),
);

// 1. Create a minimal workflow
const { data: workflow, error: createErr } = await Workflow.postWorkflows({
  client,
  body: {
    name: 'Lifecycle Demo',
    nodes: [],
    settings: {},
  },
});

if (createErr) throw createErr;
console.log(`Workflow created: ${workflow!.id} "${workflow!.name}"`);

// 2. Activate it
await Workflow.postWorkflowsByIdActivate({ client, path: { id: workflow!.id! } });
console.log('Workflow activated');

// 3. Poll executions
const { data: execs } = await Execution.getExecutions({
  client,
  query: { workflowId: workflow!.id, limit: 5 },
});
console.log(`Executions found: ${execs?.data?.length ?? 0}`);

// 4. Deactivate
await Workflow.postWorkflowsByIdDeactivate({ client, path: { id: workflow!.id! } });
console.log('Workflow deactivated');

// 5. Clean up
await Workflow.deleteWorkflowsById({ client, path: { id: workflow!.id! } });
console.log('Workflow deleted');
