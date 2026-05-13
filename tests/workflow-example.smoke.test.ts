import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { createClient, createConfig, Workflow } from '../src';

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';
const HAS_API_KEY = N8N_API_KEY.length > 0;

const client = createClient(
  createConfig({
    baseUrl: N8N_BASE_URL,
    headers: { 'X-N8N-API-KEY': N8N_API_KEY },
  }),
);

const workflowTemplatePath = join(process.cwd(), 'docs/examples/simple-webhook-workflow.json');
const workflowTemplate = JSON.parse(readFileSync(workflowTemplatePath, 'utf8')) as {
  name: string;
  nodes: unknown[];
  connections: Record<string, unknown>;
  settings: Record<string, unknown>;
};

(HAS_API_KEY ? describe : describe.skip)('Workflow example from docs', () => {
  let workflowId = '';

  it('creates workflow from docs/examples/simple-webhook-workflow.json', async () => {
    const { data, error } = await Workflow.postWorkflows({
      client,
      body: {
        ...workflowTemplate,
        name: `${workflowTemplate.name} ${Date.now()}`,
      } as any,
    });

    expect(error).toBeUndefined();
    expect(data?.id).toBeDefined();
    workflowId = data!.id!;
  });

  it('fetches created workflow by id', async () => {
    const { data, error } = await Workflow.getWorkflowsById({
      client,
      path: { id: workflowId },
    });

    expect(error).toBeUndefined();
    expect(data?.id).toBe(workflowId);
  });

  it('activates and deactivates workflow', async () => {
    const { error: activateError } = await Workflow.postWorkflowsByIdActivate({
      client,
      path: { id: workflowId },
    });

    expect(activateError).toBeUndefined();

    const { error: deactivateError } = await Workflow.postWorkflowsByIdDeactivate({
      client,
      path: { id: workflowId },
    });

    expect(deactivateError).toBeUndefined();
  });

  afterAll(async () => {
    if (!workflowId) return;
    await Workflow.deleteWorkflowsById({ client, path: { id: workflowId } });
  });
});
