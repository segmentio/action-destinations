# Destination Index Template

This template is used to generate the main destination `index.ts` file.

## Template Structure

```typescript
import type { DestinationDefinition } from '@segment/actions-core'
import type { Settings } from './generated-types'

// Import all actions
{{ACTION_IMPORTS}}

const destination: DestinationDefinition<Settings> = {
  name: '{{DESTINATION_NAME}}',
  slug: '{{DESTINATION_SLUG}}',
  mode: 'cloud',

  description: '{{DESTINATION_DESCRIPTION}}',

  authentication: {
    scheme: '{{AUTH_SCHEME}}',
    fields: {
      {{AUTH_FIELDS}}
    },
    testAuthentication: (request, { settings }) => {
      {{TEST_AUTH_IMPLEMENTATION}}
    }
  },

  extendRequest({ settings }) {
    return {
      {{EXTEND_REQUEST_IMPLEMENTATION}}
    }
  },

  actions: {
    {{ACTION_EXPORTS}}
  }
}

export default destination
```

## Placeholders

### {{ACTION_IMPORTS}}

Generate import statements for each action:

```typescript
import actionName from './action-name'
import anotherAction from './another-action'
```

### {{DESTINATION_NAME}}

Human-readable destination name (e.g., "Acme Marketing")

### {{DESTINATION_SLUG}}

Kebab-case slug (e.g., "acme-marketing")

### {{DESTINATION_DESCRIPTION}}

Description from OpenAPI `info.description`

### {{AUTH_SCHEME}}

One of: 'custom', 'basic', 'oauth2', 'oauth-managed'

### {{AUTH_FIELDS}}

Authentication field definitions. Examples:

**Custom (API Key):**

```typescript
apiKey: {
  label: 'API Key',
  description: 'Your API key from [Provider]',
  type: 'password',
  required: true
}
```

**Basic:**

```typescript
username: {
  label: 'Username',
  description: 'Your username',
  type: 'string',
  required: true
},
password: {
  label: 'Password',
  description: 'Your password',
  type: 'password',
  required: true
}
```

**OAuth-managed:**

```typescript
// No additional fields for managed OAuth
```

### {{TEST_AUTH_IMPLEMENTATION}}

Test authentication request. Examples:

**With known endpoint:**

```typescript
return request('{{TEST_ENDPOINT}}', {
  method: 'GET'
})
```

**Without known endpoint:**

```typescript
// TODO: Implement authentication test
// Suggested approach: Make a lightweight API call that requires authentication
// Example: GET /me, GET /account, GET /user
throw new Error('Not implemented')
```

### {{EXTEND_REQUEST_IMPLEMENTATION}}

Request configuration. Examples:

**API Key in Header:**

```typescript
headers: {
  Authorization: `Bearer ${settings.apiKey}`,
  'Content-Type': 'application/json',
  'User-Agent': 'Segment (Actions)'
}
```

**Basic Auth:**

```typescript
headers: {
  'Content-Type': 'application/json',
  'User-Agent': 'Segment (Actions)'
}
// Basic auth is handled automatically by the framework
```

**With Regional Endpoints:**

```typescript
headers: {
  Authorization: `Bearer ${settings.apiKey}`,
  'Content-Type': 'application/json'
},
prefixUrl: getBaseUrl(settings.region)
```

And add helper function before destination definition:

```typescript
function getBaseUrl(region: string): string {
  const urls: Record<string, string> = {
    us: '{{US_BASE_URL}}',
    eu: '{{EU_BASE_URL}}'
  }
  return urls[region] || urls.us
}
```

### {{ACTION_EXPORTS}}

Action object exports:

```typescript
actionName, anotherAction
```

## Special Cases

### Regional Endpoints

If multiple regions are detected, add a region field to authentication:

```typescript
authentication: {
  scheme: 'custom',
  fields: {
    apiKey: {
      label: 'API Key',
      description: 'Your API key',
      type: 'password',
      required: true
    },
    region: {
      label: 'Region',
      description: 'Select your API region',
      type: 'string',
      required: true,
      choices: [
        { label: 'US', value: 'us' },
        { label: 'EU', value: 'eu' }
      ],
      default: 'us'
    }
  },
  // ... rest of authentication
}
```

### Additional Global Settings

If there are common parameters across actions, add them as destination settings:

```typescript
authentication: {
  // ... auth config
},
extendRequest({ settings }) {
  // ... request config
},
// Add this section if needed
onDelete: async (request, { settings, payload }) => {
  // Optional: Handle user deletion requests (for privacy compliance)
  // TODO: Implement if API supports user deletion
},
```
