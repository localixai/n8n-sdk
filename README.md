# @n8n/api-sdk

Type-safe TypeScript SDK for the [n8n Public API](https://docs.n8n.io/api/), auto-generated from the official OpenAPI spec.

Repository: [localixai/n8n-sdk](https://github.com/localixai/n8n-sdk)

## Features

- Full TypeScript types for all request/response bodies
- Static service classes per resource (`Workflow`, `Execution`, `Credential`, `Tags`, `User`, `Variables`, `Projects`, `Insights`, `Folders`, …)
- ESM + CJS dual output
- Works in Node.js, Deno, Bun, and modern browsers
- Zero runtime dependencies beyond a `fetch`-based client

## Installation

```bash
npm install @n8n/api-sdk
# or
pnpm add @n8n/api-sdk
# or
bun add @n8n/api-sdk
```

## Quick start

```typescript
import { createClient, createConfig, Workflow, Execution, Tags } from '@n8n/api-sdk';

// Create and configure the client once
const client = createClient(
  createConfig({
    baseUrl: 'https://your-n8n.example.com/api/v1',
    headers: {
      'X-N8N-API-KEY': 'your-api-key',
    },
  }),
);

// List workflows
const { data, error } = await Workflow.getWorkflows({ client });
if (error) throw error;
console.log(data?.data);

// Get a single workflow
const { data: wf } = await Workflow.getWorkflowsById({
  client,
  path: { id: 'workflow-id' },
});

// Activate / deactivate a workflow
await Workflow.postWorkflowsByIdActivate({ client, path: { id: 'workflow-id' } });
await Workflow.postWorkflowsByIdDeactivate({ client, path: { id: 'workflow-id' } });

// List executions (with filters)
const { data: execs } = await Execution.getExecutions({
  client,
  query: { status: 'success', limit: 20 },
});
```

## API Reference

Documentation links:

- Usage Guide: `https://github.com/localixai/n8n-sdk/blob/main/docs/USAGE.md`
- Release Standard: `https://github.com/localixai/n8n-sdk/blob/main/docs/RELEASE.md`
- Examples: `https://github.com/localixai/n8n-sdk/tree/main/docs/examples`
- OpenAPI Source: `https://github.com/localixai/n8n-sdk/blob/main/openapi.json`

### Client setup

```typescript
import { createClient, createConfig } from '@n8n/api-sdk';

const client = createClient(
  createConfig({
    baseUrl: 'https://your-n8n.example.com/api/v1',
    headers: { 'X-N8N-API-KEY': process.env.N8N_API_KEY! },
  }),
);
```

### Available service classes

| Class | Description |
| --- | --- |
| `Workflow` | CRUD + activate/deactivate/archive workflows |
| `Execution` | List, get, stop, retry executions |
| `Credential` | Manage credentials |
| `Tags` | Create and manage tags |
| `User` | User management |
| `Variables` | Environment variables |
| `Projects` | Projects and folders |
| `Folders` | Workflow folders |
| `Insights` | Execution insights/metrics |
| `Audit` | Security audit log |
| `CommunityPackage` | Install/update community nodes |
| `SourceControl` | Git source control pull |
| `Discover` | API capability discovery |

All methods follow the pattern:

```typescript
const { data, error } = await ServiceClass.methodName({
  client,          // required: the configured client
  path: { ... },   // path parameters (e.g. { id: '...' })
  query: { ... },  // query parameters
  body: { ... },   // request body
});
```

## Environment variables

| Variable | Description |
| --- | --- |
| `N8N_BASE_URL` | Base URL of your n8n instance, e.g. `http://localhost:5678/api/v1` |
| `N8N_API_KEY` | API key (Settings → n8n API in the n8n UI) |

## Regenerating from a newer OpenAPI spec

```bash
# 1. Bundle the updated spec
npx @redocly/cli bundle path/to/openapi.yml --output openapi.json --ext json

# 2. Regenerate SDK
npm run generate

# 3. Rebuild
npm run build
```

## Release Standard

- Process guide: `docs/RELEASE.md`
- Pre-release gate:

```bash
npm run release:check
```

- Publish flow:

```bash
npm version patch   # or minor / major
git push origin main --follow-tags
```

Pushing tag `vX.Y.Z` triggers npm publish workflow automatically.

## Development

```bash
npm run typecheck   # TypeScript type check
npm run build       # Compile to dist/
npm test            # Run unit tests
npm run test:smoke  # Run live n8n smoke tests
npm run example:workflow # Run full workflow CRUD demo via SDK
npm run example:backend  # Run full backend control-plane demo
```

## Working Workflow Example

This repository includes a real, runnable n8n workflow example:

- docs/examples/simple-webhook-workflow.json

And an SDK demo script that uses this workflow end-to-end (create, fetch, activate, deactivate, delete):

- docs/examples/sdk-simple-workflow-demo.ts

Run it with:

```bash
N8N_BASE_URL=http://localhost:5678/api/v1 \
N8N_API_KEY=your_api_key \
npm run example:workflow
```

## n8n as Backend Control Plane

For fully programmatic management (workflows, credential metadata, and secrets-like values), use:

- docs/examples/backend-control-plane.ts

This scenario demonstrates:

1. Creating and rotating variable values (used as app secrets).
2. Creating and updating credential metadata.
3. Creating workflow JSON with credential reference in node.
4. Updating workflow definition through API.
5. Activating/deactivating and deleting workflow.

Run it with:

```bash
N8N_BASE_URL=http://localhost:5678/api/v1 \
N8N_API_KEY=your_api_key \
npm run example:backend
```

Note: n8n Public API does not return credential secret values on read endpoints.
Credential creation requires `data` in request payload. In this repo example we use `httpHeaderAuth` with demo data.
Variables API can be license-gated depending on your n8n plan. The example script handles this gracefully.

## Why SDK Instead of MCP for Agents

Use MCP n8n when the agent only needs ad-hoc tool calls in a conversational loop.
Use this SDK when n8n is your backend platform and you need stable, repeatable automation lifecycle.

Why SDK is better for production agent workflows:

1. Persistent automation lifecycle: create, update, activate, deactivate, transfer, and delete workflows programmatically.
2. Code-level memory and reuse: the agent can keep reusable TypeScript logic, templates, and tests instead of rebuilding tool prompts each session.
3. Versionable infrastructure: workflows and automation changes go through git, PR review, CI checks, and release tags.
4. Safer deployments: release gates (`release:check`) validate typecheck/build/tests/docs/pack before publish.
5. Easier bulk operations: update many workflows/credentials/secrets-like variables from scripts, not one-by-one manual UI steps.
6. Deterministic API contracts: generated types from OpenAPI reduce runtime errors and schema drift.

Practical split:

1. MCP: quick interactive operations.
2. SDK: engineering-grade workflow backend and deployment pipeline.

## Agent Skills

This repository includes installable Agent Skills so users can quickly equip agents with n8n SDK workflows.

Install from this repository:

```bash
npx skills add localixai/n8n-sdk
```

Included skills:

1. `n8n-sdk-workflow-backend`: full workflow/credential/variables control-plane operations.
2. `n8n-sdk-release-docs`: release checks, docs generation, and publish/deploy standardization.

## License

MIT
