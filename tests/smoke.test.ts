/**
 * Smoke tests for the n8n API SDK.
 *
 * These tests run against a live n8n instance.
 * Configure via environment variables:
 *   N8N_BASE_URL  – default: http://localhost:5678/api/v1
 *   N8N_API_KEY   – required
 */
import { afterAll, describe, expect, it } from 'vitest';
import { createClient, createConfig } from '../src/generated/client';
import {
  Execution,
  Tags,
  User,
  Variables,
  Workflow,
} from '../src/generated/sdk.gen';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const N8N_BASE_URL =
  process.env.N8N_BASE_URL ?? 'http://localhost:5678/api/v1';
const N8N_API_KEY = process.env.N8N_API_KEY ?? '';
const HAS_API_KEY = N8N_API_KEY.length > 0;

function makeClient() {
  return createClient(
    createConfig({
      baseUrl: N8N_BASE_URL,
      headers: { 'X-N8N-API-KEY': N8N_API_KEY },
    }),
  );
}

// ---------------------------------------------------------------------------
// Connectivity check
// ---------------------------------------------------------------------------

describe('connectivity', () => {
  it('uses configured base URL', () => {
    expect(N8N_BASE_URL).toContain('/api/v1');
  });
});

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

(HAS_API_KEY ? describe : describe.skip)('Workflow API', () => {
  const client = makeClient();
  let workflowId: string;

  it('lists workflows', async () => {
    const { data, error } = await Workflow.getWorkflows({
      client,
      query: { limit: 5 },
    });
    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(Array.isArray(data?.data)).toBe(true);
  });

  it('creates a workflow', async () => {
    // Runtime API currently requires `connections`, even though the generated
    // writable type does not expose it.
    const { data, error } = await Workflow.postWorkflows({
      client,
      body: {
        name: `SDK Smoke Test ${Date.now()}`,
        nodes: [],
        connections: {},
        settings: {},
      } as any,
    });
    expect(error).toBeUndefined();
    expect(data?.id).toBeDefined();
    expect(typeof data?.name).toBe('string');
    workflowId = data!.id!;
  });

  it('fetches the created workflow by id', async () => {
    const { data, error } = await Workflow.getWorkflowsById({
      client,
      path: { id: workflowId },
    });
    expect(error).toBeUndefined();
    expect(data?.id).toBe(workflowId);
  });

  it('activates the workflow', async () => {
    const { data, error } = await Workflow.postWorkflowsByIdActivate({
      client,
      path: { id: workflowId },
    });
    if (error) {
      expect((error as { message?: string }).message ?? '').toContain('trigger node');
    } else {
      expect(data).toBeDefined();
    }
  });

  it('deactivates the workflow', async () => {
    const { error } = await Workflow.postWorkflowsByIdDeactivate({
      client,
      path: { id: workflowId },
    });
    expect(error).toBeUndefined();
  });

  afterAll(async () => {
    if (workflowId) {
      await Workflow.deleteWorkflowsById({ client, path: { id: workflowId } });
    }
  });
});

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

(HAS_API_KEY ? describe : describe.skip)('Tags API', () => {
  const client = makeClient();
  let tagId: string;

  it('lists tags', async () => {
    const { data, error } = await Tags.getTags({ client });
    expect(error).toBeUndefined();
    expect(Array.isArray(data?.data)).toBe(true);
  });

  it('creates a tag', async () => {
    const { data, error } = await Tags.postTags({
      client,
      body: { name: `sdk-smoke-${Date.now()}` },
    });
    expect(error).toBeUndefined();
    expect(data?.id).toBeDefined();
    tagId = data!.id!;
  });

  it('fetches tag by id', async () => {
    const { data, error } = await Tags.getTagsById({
      client,
      path: { id: tagId },
    });
    expect(error).toBeUndefined();
    expect(data?.id).toBe(tagId);
  });

  it('updates a tag', async () => {
    const newName = `sdk-smoke-updated-${Date.now()}`;
    const { data, error } = await Tags.putTagsById({
      client,
      path: { id: tagId },
      body: { name: newName },
    });
    if (error) {
      expect((error as { message?: string }).message ?? '').toContain('already exists');
    } else {
      expect(data?.name).toBe(newName);
    }
  });

  afterAll(async () => {
    if (tagId) {
      await Tags.deleteTagsById({ client, path: { id: tagId } });
    }
  });
});

// ---------------------------------------------------------------------------
// Executions
// ---------------------------------------------------------------------------

(HAS_API_KEY ? describe : describe.skip)('Execution API', () => {
  const client = makeClient();

  it('lists executions', async () => {
    const { data, error } = await Execution.getExecutions({
      client,
      query: { limit: 10 },
    });
    expect(error).toBeUndefined();
    expect(data).toBeDefined();
    expect(Array.isArray(data?.data)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

(HAS_API_KEY ? describe : describe.skip)('User API', () => {
  const client = makeClient();

  it('lists users', async () => {
    const { data, error } = await User.getUsers({ client });
    expect(error).toBeUndefined();
    expect(Array.isArray(data?.data)).toBe(true);
    expect((data?.data?.length ?? 0)).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Variables
// ---------------------------------------------------------------------------

(HAS_API_KEY ? describe : describe.skip)('Variables API', () => {
  const client = makeClient();

  it('lists variables', async () => {
    const { data, error } = await Variables.getVariables({ client });
    if (error) {
      expect((error as { message?: string }).message ?? '').toContain('license');
    } else {
      expect(Array.isArray(data?.data)).toBe(true);
    }
  });
});
