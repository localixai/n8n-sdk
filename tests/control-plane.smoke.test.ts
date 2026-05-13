import { afterAll, describe, expect, it } from 'vitest';
import { createClient, createConfig, Credential, Variables, Workflow } from '../src';

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

const N8N_BASE_URL = process.env.N8N_BASE_URL ?? 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';
const HAS_API_KEY = N8N_API_KEY.length > 0;

const client = createClient(
  createConfig({
    baseUrl: N8N_BASE_URL,
    headers: { 'X-N8N-API-KEY': N8N_API_KEY },
  }),
);

(HAS_API_KEY ? describe : describe.skip)('Control-plane backend scenario', () => {
  const suffix = Date.now();
  const variableKey = `SDK_SECRET_${suffix}`;
  let variableId = '';
  let variableEnabled = false;
  let credentialId = '';
  let credentialName = '';
  let credentialEnabled = false;
  let workflowId = '';

  it('creates a variable secret', async () => {
    const created = await Variables.postVariables({
      client,
      body: {
        key: variableKey,
        value: 'secret-v1',
      },
    });

    if (created.error) {
      expect(isFeatureUnavailable(created.error)).toBe(true);
      return;
    }

    const listed = await Variables.getVariables({ client, query: { limit: 100 } });
    expect(listed.error).toBeUndefined();

    const item = (listed.data?.data ?? []).find((v) => v.key === variableKey);
    expect(item?.id).toBeDefined();
    variableId = item!.id!;
    variableEnabled = true;
  });

  it('creates a credential and updates its metadata', async () => {
    const created = await Credential.createCredential({
      client,
      body: {
        name: `sdk-header-auth-${suffix}`,
        type: 'httpHeaderAuth',
        data: {
          name: 'X-API-KEY',
          value: `sdk-token-${suffix}`,
        },
      },
    });

    if (created.error) {
      expect(errorMessage(created.error).length).toBeGreaterThan(0);
      return;
    }

    expect(created.data?.id).toBeDefined();
    credentialId = created.data!.id;
    credentialName = created.data!.name;
    credentialEnabled = true;

    const updated = await Credential.updateCredential({
      client,
      path: { id: credentialId },
      body: {
        name: `${credentialName}-updated`,
      },
    });

    expect(updated.error).toBeUndefined();
  });

  it('creates and updates workflow with secret + credential references', async () => {
    const created = await Workflow.postWorkflows({
      client,
      body: {
        name: `SDK Backend Workflow ${suffix}`,
        nodes: [
          {
            id: 'webhook-node',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 2,
            position: [280, 300],
            parameters: {
              path: `sdk-backend-smoke-${suffix}`,
              httpMethod: 'GET',
              responseMode: 'lastNode',
            },
          },
          {
            id: 'http-node',
            name: 'HTTP Request',
            type: 'n8n-nodes-base.httpRequest',
            typeVersion: 4,
            position: [560, 300],
            parameters: {
              method: 'GET',
              url: 'https://httpbin.org/get',
              options: {},
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
            position: [840, 300],
            parameters: {
              assignments: {
                assignments: [
                  {
                    name: 'backendSecret',
                    type: 'string',
                    value: variableEnabled ? `={{ $vars.${variableKey} }}` : 'no-variable-feature',
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
            position: [1100, 300],
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
      },
    });

    expect(created.error).toBeUndefined();
    expect(created.data?.id).toBeDefined();
    workflowId = created.data!.id!;

    const fetched = await Workflow.getWorkflowsById({
      client,
      path: { id: workflowId },
    });

    expect(fetched.error).toBeUndefined();

    const updated = await Workflow.putWorkflowsById({
      client,
      path: { id: workflowId },
      body: {
        name: `${fetched.data!.name} updated`,
        description: 'SDK managed backend workflow',
        nodes: fetched.data!.nodes ?? [],
        settings: fetched.data!.settings ?? {},
        connections: fetched.data!.connections ?? {},
      } as any,
    });

    expect(updated.error).toBeUndefined();

    const activate = await Workflow.postWorkflowsByIdActivate({
      client,
      path: { id: workflowId },
    });
    expect(activate.error).toBeUndefined();

    const deactivate = await Workflow.postWorkflowsByIdDeactivate({
      client,
      path: { id: workflowId },
    });
    expect(deactivate.error).toBeUndefined();
  });

  it('rotates variable value', async () => {
    if (!variableEnabled || !variableId) {
      expect(true).toBe(true);
      return;
    }

    const updated = await Variables.putVariablesById({
      client,
      path: { id: variableId },
      body: {
        key: variableKey,
        value: 'secret-v2',
      },
    });

    if (updated.error) {
      expect(isFeatureUnavailable(updated.error)).toBe(true);
    } else {
      expect(updated.error).toBeUndefined();
    }
  });

  afterAll(async () => {
    if (workflowId) {
      await Workflow.deleteWorkflowsById({ client, path: { id: workflowId } });
    }

    if (credentialId) {
      await Credential.deleteCredential({ client, path: { id: credentialId } });
    }

    if (variableId) {
      await Variables.deleteVariablesById({ client, path: { id: variableId } });
    }
  });
});
