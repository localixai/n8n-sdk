import { createClient, createConfig } from '../../src/generated/client';
import {
  Workflow,
  Execution,
  Tags,
  Variables,
  User,
} from '../../src/generated/sdk.gen';

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------
const client = createClient(
  createConfig({
    baseUrl: process.env.N8N_BASE_URL ?? 'http://localhost:5678/api/v1',
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY ?? '',
    },
  }),
);

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

// List all workflows (first page)
const { data: workflowList, error } = await Workflow.getWorkflows({ client, query: { limit: 10 } });
if (error) throw error;
console.log('Workflows:', workflowList?.data?.map((w) => w.name));

// Create a minimal workflow
const { data: created } = await Workflow.postWorkflows({
  client,
  body: {
    name: 'My SDK Workflow',
    nodes: [],
    settings: {},
  },
});
const workflowId = created?.id!;
console.log('Created workflow id:', workflowId);

// Get the workflow
const { data: workflow } = await Workflow.getWorkflowsById({
  client,
  path: { id: workflowId },
});
console.log('Fetched:', workflow?.name);

// Activate
await Workflow.postWorkflowsByIdActivate({ client, path: { id: workflowId } });
console.log('Activated');

// Deactivate
await Workflow.postWorkflowsByIdDeactivate({ client, path: { id: workflowId } });
console.log('Deactivated');

// Delete
await Workflow.deleteWorkflowsById({ client, path: { id: workflowId } });
console.log('Deleted');

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

// Create a tag
const { data: tag } = await Tags.postTags({ client, body: { name: 'sdk-example' } });
console.log('Created tag:', tag?.name);

// List tags
const { data: tagList } = await Tags.getTags({ client });
console.log('Tags:', tagList?.data?.map((t) => t.name));

// Delete the tag
await Tags.deleteTagsById({ client, path: { id: tag?.id! } });
console.log('Tag deleted');

// ---------------------------------------------------------------------------
// Executions
// ---------------------------------------------------------------------------

// List recent executions
const { data: execList } = await Execution.getExecutions({
  client,
  query: { limit: 5 },
});
console.log('Recent executions:', execList?.data?.length ?? 0);

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

const { data: vars } = await Variables.getVariables({ client });
console.log('Variables:', vars?.data?.length ?? 0);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

const { data: users } = await User.getUsers({ client });
console.log('Users:', users?.data?.map((u) => u.email));
