# SDK Usage Guide

## Prerequisites

- n8n instance URL
- n8n API key with required scopes

## Configure client

```ts
import { createClient, createConfig } from '@localixai/n8n-sdk';

export const client = createClient(
  createConfig({
    baseUrl: process.env.N8N_BASE_URL ?? 'http://localhost:5678/api/v1',
    headers: {
      'X-N8N-API-KEY': process.env.N8N_API_KEY ?? '',
    },
  }),
);
```

## Common patterns

### List workflows

```ts
import { Workflow } from '@localixai/n8n-sdk';
import { client } from './client';

const { data, error } = await Workflow.getWorkflows({
  client,
  query: { limit: 20 },
});

if (error) throw error;
console.log(data?.data);
```

### Create and delete workflow

```ts
import { Workflow } from '@localixai/n8n-sdk';
import { client } from './client';

const { data: created, error: createError } = await Workflow.postWorkflows({
  client,
  body: {
    name: 'Created via SDK',
    nodes: [],
    settings: {},
  },
});
if (createError) throw createError;

await Workflow.deleteWorkflowsById({
  client,
  path: { id: created!.id! },
});
```

### List executions

```ts
import { Execution } from '@localixai/n8n-sdk';
import { client } from './client';

const { data, error } = await Execution.getExecutions({
  client,
  query: { limit: 10 },
});

if (error) throw error;
console.log(data?.data?.length ?? 0);
```

## Examples

- See `docs/examples/basic-usage.ts`
- See `docs/examples/workflow-lifecycle.ts`
- See `docs/examples/sdk-simple-workflow-demo.ts`
- See `docs/examples/backend-control-plane.ts`
- See `docs/examples/telegram-hi-bot-cloudflare.ts`

## Workflow JSON + SDK (working example)

The file `docs/examples/simple-webhook-workflow.json` is a minimal working n8n workflow (Webhook -> Respond).

You can test the full SDK lifecycle on this workflow:

```bash
N8N_BASE_URL=http://localhost:5678/api/v1 \
N8N_API_KEY=your_api_key \
npm run example:workflow
```

This script will:

1. Create a workflow from JSON.
2. Fetch it by id.
3. Activate it.
4. Deactivate it.
5. Delete it.

## Fully Programmatic Backend Control Plane

Use `docs/examples/backend-control-plane.ts` to manage n8n as backend infrastructure:

1. Create variable and use it as secret-like runtime value.
2. Create credential metadata and update it.
3. Create workflow and attach credential reference to node.
4. Update workflow via API.
5. Rotate variable value (secret rotation).
6. Activate/deactivate and cleanup resources.

Run:

```bash
N8N_BASE_URL=http://localhost:5678/api/v1 \
N8N_API_KEY=your_api_key \
npm run example:backend
```

## Telegram Hi Bot + Cloudflare (TypeScript)

Use `docs/examples/telegram-hi-bot-cloudflare.ts` to run a TypeScript-only setup for a Telegram bot that always replies with `hi`.

It covers:

1. Cloudflare account verification via official npm package `cloudflare`.
2. Telegram credential create/update (`telegramApi`).
3. Idempotent workflow create/update for Telegram Trigger -> Telegram sendMessage.
4. Workflow activation and state validation.

Run:

```bash
N8N_BASE_URL=http://localhost:5678/api/v1 \
N8N_API_KEY=your_api_key \
TELEGRAM_BOT_TOKEN=your_telegram_bot_token \
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token \
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id \
CLOUDFLARE_TUNNEL_PUBLIC_URL=https://your-public-tunnel.example \
npm run example:telegram-cloudflare
```

Note: Telegram Trigger activation requires a publicly reachable HTTPS webhook URL.
