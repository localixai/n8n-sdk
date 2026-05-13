import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient, createConfig, Workflow } from '../../src/index';

async function run() {
  const client = createClient(
    createConfig({
      baseUrl: process.env.N8N_BASE_URL ?? 'http://localhost:5678/api/v1',
      headers: {
        'X-N8N-API-KEY': process.env.N8N_API_KEY ?? '',
      },
    }),
  );

  const workflowPath = join(process.cwd(), 'docs/examples/simple-webhook-workflow.json');
  const workflowTemplate = JSON.parse(readFileSync(workflowPath, 'utf8')) as {
    name: string;
    nodes: unknown[];
    connections: Record<string, unknown>;
    settings: Record<string, unknown>;
  };

  const uniqueName = `${workflowTemplate.name} ${Date.now()}`;

  const { data: created, error: createError } = await Workflow.postWorkflows({
    client,
    body: {
      ...workflowTemplate,
      name: uniqueName,
    } as any,
  });

  if (createError || !created?.id) {
    throw new Error(`Failed to create workflow: ${JSON.stringify(createError)}`);
  }

  console.log('Created workflow:', created.id, created.name);

  const { data: fetched, error: fetchError } = await Workflow.getWorkflowsById({
    client,
    path: { id: created.id },
  });
  if (fetchError) throw new Error(`Failed to fetch workflow: ${JSON.stringify(fetchError)}`);

  console.log('Fetched workflow:', fetched?.id, fetched?.name);

  const { error: activateError } = await Workflow.postWorkflowsByIdActivate({
    client,
    path: { id: created.id },
  });
  if (activateError) {
    console.log('Activation warning:', (activateError as { message?: string }).message ?? activateError);
  } else {
    console.log('Workflow activated');
  }

  const { error: deactivateError } = await Workflow.postWorkflowsByIdDeactivate({
    client,
    path: { id: created.id },
  });
  if (deactivateError) throw new Error(`Failed to deactivate workflow: ${JSON.stringify(deactivateError)}`);

  console.log('Workflow deactivated');

  const { error: deleteError } = await Workflow.deleteWorkflowsById({
    client,
    path: { id: created.id },
  });
  if (deleteError) throw new Error(`Failed to delete workflow: ${JSON.stringify(deleteError)}`);

  console.log('Workflow deleted');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
