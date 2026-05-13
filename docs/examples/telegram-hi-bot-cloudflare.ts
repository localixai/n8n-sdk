/// <reference types="node" />
import Cloudflare from 'cloudflare';
import { createClient, createConfig, Credential, Workflow } from '../../src/index';

type Env = {
  N8N_BASE_URL: string;
  N8N_API_KEY: string;
  TELEGRAM_BOT_TOKEN: string;
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_TUNNEL_PUBLIC_URL?: string;
};

const WORKFLOW_NAME = 'Telegram Hi Bot';
const CREDENTIAL_NAME = 'telegram-hi-bot-credential';

function requireEnv(name: keyof Env): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function readEnv(): Env {
  return {
    N8N_BASE_URL: process.env.N8N_BASE_URL?.trim() || 'http://localhost:5678/api/v1',
    N8N_API_KEY: requireEnv('N8N_API_KEY'),
    TELEGRAM_BOT_TOKEN: requireEnv('TELEGRAM_BOT_TOKEN'),
    CLOUDFLARE_API_TOKEN: requireEnv('CLOUDFLARE_API_TOKEN'),
    CLOUDFLARE_ACCOUNT_ID: requireEnv('CLOUDFLARE_ACCOUNT_ID'),
    CLOUDFLARE_TUNNEL_PUBLIC_URL: process.env.CLOUDFLARE_TUNNEL_PUBLIC_URL?.trim(),
  };
}

function ensureData<T>(value: T | undefined, context: string): T {
  if (value === undefined) throw new Error(`${context}: empty response data`);
  return value;
}

function buildWorkflow(credentialId: string) {
  return {
    name: WORKFLOW_NAME,
    nodes: [
      {
        id: 'Telegram Trigger',
        name: 'Telegram Trigger',
        type: 'n8n-nodes-base.telegramTrigger',
        typeVersion: 1.3,
        position: [260, 300],
        parameters: {
          updates: ['message'],
          additionalFields: {},
        },
        credentials: {
          telegramApi: {
            id: credentialId,
            name: CREDENTIAL_NAME,
          },
        },
      },
      {
        id: 'Reply Hi',
        name: 'Reply Hi',
        type: 'n8n-nodes-base.telegram',
        typeVersion: 1.2,
        position: [560, 300],
        parameters: {
          resource: 'message',
          operation: 'sendMessage',
          chatId: '={{$json.message.chat.id}}',
          text: 'hi',
          additionalFields: {},
        },
        credentials: {
          telegramApi: {
            id: credentialId,
            name: CREDENTIAL_NAME,
          },
        },
      },
    ],
    connections: {
      'Telegram Trigger': {
        main: [
          [
            {
              node: 'Reply Hi',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
    settings: {},
    staticData: null,
  };
}

async function ensureCredential(client: ReturnType<typeof createClient>, token: string) {
  const listed = await Credential.getCredentials({
    client,
    query: { limit: 250 },
  });
  if (listed.error) throw listed.error;

  const existing = listed.data?.data?.find(
    (item) => item.name === CREDENTIAL_NAME && item.type === 'telegramApi',
  );

  if (existing?.id) {
    const updated = await Credential.updateCredential({
      client,
      path: { id: existing.id },
      body: {
        name: CREDENTIAL_NAME,
        type: 'telegramApi',
        isPartialData: false,
        data: { accessToken: token },
      } as any,
    });
    if (updated.error) throw updated.error;
    return existing.id;
  }

  const created = await Credential.createCredential({
    client,
    body: {
      name: CREDENTIAL_NAME,
      type: 'telegramApi',
      data: { accessToken: token },
    } as any,
  });
  if (created.error) throw created.error;

  return ensureData(created.data?.id, 'Credential.createCredential');
}

async function ensureWorkflow(client: ReturnType<typeof createClient>, credentialId: string) {
  const listed = await Workflow.getWorkflows({
    client,
    query: { limit: 250 },
  });
  if (listed.error) throw listed.error;

  const existing = listed.data?.data?.find((workflow) => workflow.name === WORKFLOW_NAME);
  const body = buildWorkflow(credentialId);

  if (!existing?.id) {
    const created = await Workflow.postWorkflows({ client, body });
    if (created.error) throw created.error;
    return ensureData(created.data?.id, 'Workflow.postWorkflows');
  }

  const updated = await Workflow.putWorkflowsById({
    client,
    path: { id: existing.id },
    body,
  });
  if (updated.error) throw updated.error;

  return existing.id;
}

async function main() {
  const env = readEnv();

  const cloudflare = new Cloudflare({ apiToken: env.CLOUDFLARE_API_TOKEN });
  const account = await cloudflare.accounts.get({ account_id: env.CLOUDFLARE_ACCOUNT_ID });
  console.log(`Cloudflare account verified: ${account.name} (${account.id})`);

  const client = createClient(
    createConfig({
      baseUrl: env.N8N_BASE_URL,
      headers: { 'X-N8N-API-KEY': env.N8N_API_KEY },
    }),
  );

  if (!env.CLOUDFLARE_TUNNEL_PUBLIC_URL) {
    console.log('CLOUDFLARE_TUNNEL_PUBLIC_URL is not set.');
    console.log('Telegram Trigger activation requires a reachable public HTTPS webhook URL.');
  } else {
    console.log(`Using Cloudflare tunnel URL: ${env.CLOUDFLARE_TUNNEL_PUBLIC_URL}`);
  }

  const credentialId = await ensureCredential(client, env.TELEGRAM_BOT_TOKEN);
  const workflowId = await ensureWorkflow(client, credentialId);

  const activation = await Workflow.postWorkflowsByIdActivate({
    client,
    path: { id: workflowId },
  });

  if (activation.error) {
    throw activation.error;
  }

  const check = await Workflow.getWorkflowsById({
    client,
    path: { id: workflowId },
  });
  if (check.error) throw check.error;

  console.log('Workflow ready');
  console.log(`workflowId=${workflowId}`);
  console.log(`active=${check.data?.active ? 'true' : 'false'}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
