import { describe, expect, it } from 'vitest';
import { createConfig } from '../src';

describe('SDK exports', () => {
  it('creates client config with base URL', () => {
    const config = createConfig({ baseUrl: 'http://localhost:5678/api/v1' });
    expect(config.baseUrl).toBe('http://localhost:5678/api/v1');
  });
});
