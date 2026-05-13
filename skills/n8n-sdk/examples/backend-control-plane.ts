import { createClient, createConfig, Workflow, Credential, Variables } from '../../src/index';

function errorMessage(error: unknown) {
  if (!error) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const value = (error as { message?: unknown }).message;
    if (typeof value === 'string') return value;
  }
  return JSON.stringify(error);
}

function isFeatureUnavailable(error: unknown) {
  const message = errorMessage(error).toLowerCase();
  return (
    message.includes('license') ||
    message.includes('not allowed') ||
    message.includes('forbidden')
  );
}

async function run() {
  const baseUrl = process.env.N8N_BASE_URL || 'http://localhost:5678/api/v1';
  const apiKey = process.env.N8N_API_KEY || '';

  if (!apiKey) {
    throw new Error('Set N8N_API_KEY before running this script');
  }

  const client = createClient(
    createConfig({
      baseUrl,
      headers: {
        'X-N8N-API-KEY': apiKey,
      },
    }),
  );

  const suffix = Date.now();
  const secretKey = `SDK_SECRET_TOKEN_${suffix}`;
  const staticFallbackSecret = `fallback-${suffix}`;
  let variableId = '';
  let variableEnabled = false;
  let credentialId = '';
  let credentialName = '';
  let credentialEnabled = false;
  let workflowId = '';

  try {
    const createVar = await Variables.postVariables({
      client,
      body: {
        key: secretKey,
        value: 'initial-secret-value',
      },
    });

    if (createVar.error) {
      if (isFeatureUnavailable(createVar.error)) {
        console.log('Variables feature is unavailable on this instance. Using fallback secret mode.');
      } else {
        throw new Error(`Variable create failed: ${JSON.stringify(createVar.error)}`);
      }
    } else {
      const listVars = await Variables.getVariables({ client, query: { limit: 100 } });
      if (listVars.error) throw new Error(`Variable list failed: ${JSON.stringify(listVars.error)}`);
      const createdVar = (listVars.data?.data || []).find((v) => v.key === secretKey);
      if (!createdVar?.id) throw new Error('Created variable was not found in list');
      variableId = createdVar.id;
      variableEnabled = true;
      console.log('Variable created:', createdVar.id, createdVar.key);
    }

    const createCredential = await Credential.createCredential({
      client,
      body: {
        name: `sdk-http-header-auth-${suffix}`,
        type: 'httpHeaderAuth',
        data: {
          name: 'X-API-KEY',
          value: `sdk-token-${suffix}`,
        },
      } as any,
    });

    if (createCredential.error) {
      if (isFeatureUnavailable(createCredential.error)) {
        console.log('Credential create is unavailable on this instance. Continuing without credential binding.');
      } else {
        throw new Error(`Credential create failed: ${JSON.stringify(createCredential.error)}`);
      }
    } else {
      credentialId = createCredential.data.id;
      credentialName = createCredential.data.name;
      credentialEnabled = true;
      console.log('Credential created:', credentialId, credentialName);
    }

    const createWorkflow = await Workflow.postWorkflows({
      client,
      body: {
        name: `SDK Backend Control Plane ${suffix}`,
        nodes: [
          {
            id: 'webhook-node',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 2,
            position: [280, 300],
            parameters: {
              path: `sdk-backend-${suffix}`,
              httpMethod: 'GET',
              responseMode: 'lastNode',
            },
          },
          {
            id: 'http-node',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4,
            position: [540, 300],
            parameters: {
              method: 'GET',
              url: 'https://httpbin.org/get',
              options: {
                timeout: 10000,
              },
            },
            ...(credentialEnabled
              ? {
                  credentials: {
                    httpHeaderAuth: {
                      id: credentialId,
                      name: credentialName,
                    },
                  },
                }
              : {}),
          },
          {
            id: 'set-node',
            name: 'Inject Secret',
            type: 'n8n-nodes-base.set',
            typeVersion: 3.4,
            position: [820, 300],
            parameters: {
              assignments: {
                assignments: [
                  {
                    name: 'backendSecret',
                    type: 'string',
                    value: variableEnabled
                      ? `={{ $vars.${secretKey} }}`
                      : staticFallbackSecret,
                  },
                ],
              },
              options: {},
            },
          },
          {
            id: 'respond-node',
            name: 'Respond',
            type: 'n8n-nodes-base.respondToWebhook',
            typeVersion: 1,
            position: [1080, 300],
            parameters: {
              respondWith: 'json',
              responseBody: "={{ { ok: true, secretKey: $json.backendSecret ?? 'empty' } }}",
            },
          },
        ],
        connections: {
          Webhook: {
            main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]],
          },
          'HTTP Request': {
            main: [[{ node: 'Inject Secret', type: 'main', index: 0 }]],
          },
          'Inject Secret': {
            main: [[{ node: 'Respond', type: 'main', index: 0 }]],
          },
        },
        settings: { executionOrder: 'v1' },
      } as any,
    });

    if (createWorkflow.error || !createWorkflow.data?.id) {
      throw new Error(`Workflow create failed: ${JSON.stringify(createWorkflow.error)}`);
    }
    workflowId = createWorkflow.data.id;
    console.log('Workflow created:', workflowId);

    const fetchedWorkflow = await Workflow.getWorkflowsById({
      client,
      path: { id: workflowId },
    });
    if (fetchedWorkflow.error || !fetchedWorkflow.data) {
      throw new Error(`Workflow fetch failed: ${JSON.stringify(fetchedWorkflow.error)}`);
    }

    const updateWorkflow = await Workflow.putWorkflowsById({
      client,
      path: { id: workflowId },
      body: {
        name: `${fetchedWorkflow.data.name} (updated)`,
        description: 'Managed fully via SDK',
        nodes: fetchedWorkflow.data.nodes || [],
        connections: fetchedWorkflow.data.connections || {},
        settings: fetchedWorkflow.data.settings || {},
      } as any,
    });
    if (updateWorkflow.error) {
      throw new Error(`Workflow update failed: ${JSON.stringify(updateWorkflow.error)}`);
    }
    console.log('Workflow updated');

    if (variableEnabled && variableId) {
      const rotateVariable = await Variables.putVariablesById({
        client,
        path: { id: variableId },
        body: {
          key: secretKey,
          value: 'rotated-secret-value',
        },
      });
      if (rotateVariable.error) {
        if (isFeatureUnavailable(rotateVariable.error)) {
          console.log('Variable update endpoint unavailable on this instance.');
        } else {
          throw new Error(`Variable update failed: ${JSON.stringify(rotateVariable.error)}`);
        }
      } else {
        console.log('Variable rotated');
      }
    }

    if (credentialEnabled && credentialId) {
      const updateCredential = await Credential.updateCredential({
        client,
        path: { id: credentialId },
        body: {
          name: `sdk-http-header-auth-updated-${suffix}`,
        },
      });
      if (updateCredential.error) {
        throw new Error(`Credential update failed: ${JSON.stringify(updateCredential.error)}`);
      }
      console.log('Credential updated');
    }

    const activate = await Workflow.postWorkflowsByIdActivate({
      client,
      path: { id: workflowId },
    });
    if (activate.error) {
      throw new Error(`Workflow activate failed: ${JSON.stringify(activate.error)}`);
    }
    console.log('Workflow activated');

    const deactivate = await Workflow.postWorkflowsByIdDeactivate({
      client,
      path: { id: workflowId },
    });
    if (deactivate.error) {
      throw new Error(`Workflow deactivate failed: ${JSON.stringify(deactivate.error)}`);
    }
    console.log('Workflow deactivated');

    console.log('Control-plane scenario completed successfully.');
  } finally {
    if (workflowId) {
      await Workflow.deleteWorkflowsById({ client, path: { id: workflowId } });
      console.log('Workflow deleted');
    }
    if (credentialId) {
      await Credential.deleteCredential({ client, path: { id: credentialId } });
      console.log('Credential deleted');
    }
    if (variableId) {
      await Variables.deleteVariablesById({ client, path: { id: variableId } });
      console.log('Variable deleted');
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
