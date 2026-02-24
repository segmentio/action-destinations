---
name: openapi-implement
description: Generate destination code from analysis documents (OpenAPI or web-based) and user-selected actions
version: 1.0.0
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
disable-model-invocation: false
---

# Destination Implementation Generator

This skill generates complete Segment action-destination code from analysis documents and user-selected actions.

**Supported Analysis Sources:**

- OpenAPI specifications (via `/openapi-analyze`)
- Website documentation (via `/web-analyze`)
- Any analysis document following the Standard Analysis Format

All analysis documents must follow the format defined in `.claude/skills/openapi-implement/analysis-format.md`.

## Instructions

### Step 1: Gather Inputs

Ask the user for the following information:

1. **Analysis Document Path** - Path to the analysis markdown file (should be in `packages/destination-actions/.claude/openapi-analyses/`)
2. **Destination Name** - Human-readable name (e.g., "Acme Marketing", "Braze")
3. **Destination Slug** - Auto-suggest based on name (e.g., "acme-marketing" from "Acme Marketing")
   - Remove "actions-" prefix if user includes it - this is added automatically to the path
   - Use lowercase, hyphens instead of spaces
4. **Selected Actions** - Comma-separated list of action names to implement (from the analysis doc)

### Step 2: Parse Analysis Document

Read the analysis markdown file and extract:

- API name, version, base URL
- Authentication scheme and required fields
- Test authentication endpoint
- Selected action specifications:
  - Endpoint path and method
  - Operation ID
  - Description
  - Field mappings table
  - Request body schema
  - Batch support
  - Default subscription

### Step 3: Create Destination Structure

Create the following directory structure:

```
packages/destination-actions/src/destinations/[slug]/
├── index.ts                    # Destination definition
├── generated-types.ts          # Placeholder (auto-generated later)
├── [action-1]/
│   ├── index.ts               # Action definition
│   ├── generated-types.ts     # Placeholder
│   └── __tests__/
│       └── index.test.ts      # Basic test
├── [action-2]/
│   └── ... (same structure)
└── __tests__/
    └── index.test.ts          # Destination test
```

### Step 4: Generate Destination index.ts

Read the template at `.claude/skills/openapi-implement/templates/destination-index.md` and customize it with:

- Destination name and slug
- Description from OpenAPI
- Authentication scheme and fields
- Test authentication endpoint (or TODO if not found)
- Import statements for all selected actions
- extendRequest implementation with proper headers
- Regional endpoint handling if applicable

**Authentication Scheme Templates:**

**Custom (API Key in Header):**

```typescript
authentication: {
  scheme: 'custom',
  fields: {
    apiKey: {
      label: 'API Key',
      description: 'Your [API Name] API key',
      type: 'password',
      required: true
    }
  },
  testAuthentication: (request, { settings }) => {
    return request('[TEST_ENDPOINT]', {
      method: 'GET'
    })
  }
},

extendRequest({ settings }) {
  return {
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    }
  }
}
```

**Basic Auth:**

```typescript
authentication: {
  scheme: 'basic',
  fields: {
    username: {
      label: 'Username',
      description: 'Your [API Name] username',
      type: 'string',
      required: true
    },
    password: {
      label: 'Password',
      description: 'Your [API Name] password',
      type: 'password',
      required: true
    }
  },
  testAuthentication: (request) => {
    return request('[TEST_ENDPOINT]', {
      method: 'GET'
    })
  }
}
```

**OAuth2 Managed:**

```typescript
authentication: {
  scheme: 'oauth-managed',
  fields: {
    // No additional fields needed for managed OAuth
  },
  testAuthentication: (request) => {
    return request('[TEST_ENDPOINT]', {
      method: 'GET'
    })
  }
}
```

### Step 5: Generate Action Files

For each selected action, generate three files:

#### 5.1: Action index.ts

Read the template at `.claude/skills/openapi-implement/templates/action-index.md` and customize with:

- Action title and description
- Default subscription from analysis
- Fields from the field mappings table:
  - Convert each field to an InputField definition
  - Set type, label, description, required
  - Add default path where suggested
  - Handle special types (objects, arrays, datetime)
- Perform function with request to API endpoint
- PerformBatch function if batch is supported

**Field Type Conversions:**

```typescript
// String field
fieldName: {
  label: '[Label]',
  description: '[Description]',
  type: 'string',
  required: [true|false],
  default: { '@path': '$.path.to.field' }
}

// Integer/Number field
fieldName: {
  label: '[Label]',
  description: '[Description]',
  type: 'integer', // or 'number'
  required: [true|false]
}

// Boolean field
fieldName: {
  label: '[Label]',
  description: '[Description]',
  type: 'boolean',
  required: [true|false],
  default: false
}

// Object field
fieldName: {
  label: '[Label]',
  description: '[Description]',
  type: 'object',
  required: [true|false],
  properties: {
    nestedField: {
      label: '[Nested Label]',
      type: 'string'
    }
  }
}

// Array field (multiple values)
fieldName: {
  label: '[Label]',
  description: '[Description]',
  type: 'string', // or object
  multiple: true,
  required: [true|false]
}

// Datetime field
fieldName: {
  label: '[Label]',
  description: '[Description]',
  type: 'datetime',
  required: [true|false],
  default: { '@path': '$.timestamp' }
}

// Enum field
fieldName: {
  label: '[Label]',
  description: '[Description]',
  type: 'string',
  required: [true|false],
  choices: [
    { label: 'Option 1', value: 'option1' },
    { label: 'Option 2', value: 'option2' }
  ]
}
```

**Perform Function Template:**

```typescript
perform: (request, { payload, settings }) => {
  return request('[API_ENDPOINT]', {
    method: '[POST|PUT|PATCH]',
    json: {
      // Map payload fields to API fields
      [apiField]: payload.[segmentField],
      // ... more mappings
    }
  })
}
```

**PerformBatch Function Template (if supported):**

```typescript
performBatch: (request, { payload, settings }) => {
  return request('[API_ENDPOINT]', {
    method: 'POST',
    json: payload.map(event => ({
      [apiField]: event.[segmentField],
      // ... more mappings
    }))
  })
}
```

#### 5.2: Action generated-types.ts

Create placeholder file:

```typescript
// This file is generated automatically by the CLI
// Run: ./bin/run generate:types --path packages/destination-actions/src/destinations/[slug]/index.ts

export interface Payload {
  // Types will be generated from the action definition
}
```

#### 5.3: Action Test File

Read the template at `.claude/skills/openapi-implement/templates/test-template.md` and customize with:

- Action name
- Event type (track/identify/group)
- Sample event data
- Field mappings for test
- Assertions

### Step 6: Generate Destination-Level Files

#### 6.1: Destination generated-types.ts

```typescript
// This file is generated automatically by the CLI
// Run: ./bin/run generate:types --path packages/destination-actions/src/destinations/[slug]/index.ts

export interface Settings {
  // Types will be generated from the destination definition
}
```

#### 6.2: Destination Test File

```typescript
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

describe('[Destination Name]', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      const authData = { [authField]: 'test_value' }
      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })
})
```

### Step 7: Generate TypeScript Types

Run the CLI command to generate proper types:

```bash
./bin/run generate:types --path packages/destination-actions/src/destinations/[slug]/index.ts
```

### Step 8: Create Implementation Notes

Generate a markdown file at `packages/destination-actions/src/destinations/[slug]/IMPLEMENTATION_NOTES.md`:

````markdown
# [Destination Name] Implementation Notes

**Generated:** [date]
**From OpenAPI Analysis:** [analysis file path]

## Summary

This destination was generated from an OpenAPI specification analysis. The generated code provides ~70-80% of the implementation with clear TODOs for completion.

## Generated Files

- `index.ts` - Destination definition with [auth-type] authentication
  [For each action:]
- `[action-name]/index.ts` - [Action description]
- `[action-name]/__tests__/index.test.ts` - Basic test for [action-name]

## TODO: Required Completions

### 1. Authentication

- [ ] Test `testAuthentication` with real API credentials
- [ ] Verify `extendRequest` headers are correct for API
- [ ] Confirm authentication error handling works

### 2. Actions

[For each action:]

- [ ] **[Action Name]:**
  - [ ] Review field mappings accuracy
  - [ ] Customize request body transformation if needed
  - [ ] Add error handling for API-specific errors
  - [ ] Test with real API (credentials required)

### 3. Testing

- [ ] Add comprehensive unit tests with mock API responses
- [ ] Test error scenarios (network errors, API errors, validation errors)
- [ ] Test batch operations (if applicable)
- [ ] Add integration tests

### 4. Documentation

- [ ] Update field descriptions with user-friendly language
- [ ] Add examples for complex fields
- [ ] Document any prerequisites or setup steps
- [ ] Add troubleshooting notes

## Next Steps

1. **Build and verify types:**
   ```bash
   ./bin/run generate:types --path packages/destination-actions/src/destinations/[slug]/index.ts
   yarn build
   ```
````

2. **Run tests:**

   ```bash
   yarn test packages/destination-actions/src/destinations/[slug]
   ```

3. **Fix TypeScript errors** (if any)

4. **Complete TODO items** above

5. **Test with real API:**

   - Obtain test credentials
   - Configure destination in local development
   - Send test events
   - Verify API receives correct data

6. **Code review and polish:**
   - Review generated code for any OpenAPI-specific quirks
   - Add any missing edge case handling
   - Ensure error messages are helpful

## Known Limitations of Generated Code

- **Error handling:** Generic errors are thrown - customize for API-specific error codes
- **Complex schemas:** Nested objects may need manual refinement
- **Dynamic fields:** Cannot auto-generate dynamic field implementations
- **Rate limiting:** No automatic rate limit handling - add if needed
- **Retries:** No retry logic - add if API recommends it

## API Documentation

- **Base URL:** [base URL]
- **API Docs:** [link if available]
- **Support:** [support contact if available]

```

### Step 9: Present Results

Show the user a summary:

```

✓ Created destination: [Destination Name]
✓ Location: packages/destination-actions/src/destinations/[slug]/
✓ Generated [N] actions:

- [action-1]: [one-line description]
- [action-2]: [one-line description]
  ...
  ✓ Generated TypeScript type definitions
  ✓ Created test files
  ✓ Created IMPLEMENTATION_NOTES.md

Next steps:

1. Review generated code in packages/destination-actions/src/destinations/[slug]/
2. Run: yarn build
3. Fix any TypeScript errors
4. Complete TODOs in IMPLEMENTATION_NOTES.md
5. Run: yarn test packages/destination-actions/src/destinations/[slug]
6. Test with real API credentials

```

## Tips

- Always generate well-formatted, idiomatic TypeScript
- Follow existing destination patterns in the codebase
- Use proper imports from '@segment/actions-core'
- Leave clear TODO comments for manual work
- Ensure all files have proper error handling imports even if not fully implemented
- Keep perform functions simple - map payload to API request
- For complex transformations, add TODO comments explaining what's needed
```
