# Credential and Variables Playbook

## Use when

- Creating or rotating credentials.
- Wiring credentials into workflow nodes.
- Managing variables as secret-like runtime values.

## Credential basics

Important: credential read endpoints do not expose secret values.

## Create credential example

```ts
import { Credential } from '@localixai/n8n-sdk';

const createdCredential = await Credential.postCredentials({
  client,
  body: {
    name: 'sdk-http-header-auth-v2',
    type: 'httpHeaderAuth',
    data: {
      name: 'X-API-KEY',
      value: 'replace-me',
    },
  },
});

if (createdCredential.error) throw createdCredential.error;
const credentialId = createdCredential.data?.id;
```

## Rotation flow

1. Create new credential (do not overwrite blindly).
2. Update workflows to reference new credential ID.
3. Save workflows and run validation.
4. Remove old credential only after successful validation.

## Variables note

Variables endpoint availability can depend on n8n plan/license. Always handle feature unavailability gracefully.
