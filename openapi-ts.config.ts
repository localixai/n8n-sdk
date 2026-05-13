import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: {
    path: './src/generated',
    module: {
      extension: '.js',
    },
  },
  plugins: [
    '@hey-api/typescript',
    {
      name: '@hey-api/sdk',
      operations: {
        strategy: 'byTags',
        nesting: 'operationId',
      },
    },
    '@hey-api/client-fetch',
  ],
});
