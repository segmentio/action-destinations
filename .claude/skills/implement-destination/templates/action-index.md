# Action Index Template

This template is used to generate each action's `index.ts` file.

## Template Structure

```typescript
import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: '{{ACTION_TITLE}}',
  description: '{{ACTION_DESCRIPTION}}',

  {{DEFAULT_SUBSCRIPTION}}

  fields: {
    {{FIELD_DEFINITIONS}}
  },

  perform: (request, { payload, settings }) => {
    {{PERFORM_IMPLEMENTATION}}
  }{{PERFORM_BATCH}}
}

export default action
```

## Placeholders

### {{ACTION_TITLE}}

Human-readable action title (e.g., "Track Event", "Identify User")

### {{ACTION_DESCRIPTION}}

Description from OpenAPI operation summary/description

### {{DEFAULT_SUBSCRIPTION}}

Subscription pattern for when this action should trigger. Examples:

**Track Events:**

```typescript
defaultSubscription: 'type = "track"',
```

**Identify Events:**

```typescript
defaultSubscription: 'type = "identify"',
```

**Group Events:**

```typescript
defaultSubscription: 'type = "group"',
```

**Specific Event Names:**

```typescript
defaultSubscription: 'type = "track" and event = "Order Completed"',
```

### {{FIELD_DEFINITIONS}}

Field definitions from OpenAPI schema. Format:

```typescript
fieldName: {
  label: 'Field Label',
  description: 'Field description from OpenAPI schema',
  type: 'string', // or integer, number, boolean, object, datetime
  required: true, // or false
  default: { '@path': '$.path.to.field' } // if applicable
},
anotherField: {
  label: 'Another Field',
  description: 'Description',
  type: 'integer',
  required: false
}
```

**Common Field Patterns:**

**User ID:**

```typescript
userId: {
  label: 'User ID',
  description: 'Unique identifier for the user',
  type: 'string',
  required: true,
  default: { '@path': '$.userId' }
}
```

**Email:**

```typescript
email: {
  label: 'Email',
  description: 'User email address',
  type: 'string',
  required: false,
  default: { '@path': '$.traits.email' }
}
```

**Event Name:**

```typescript
event: {
  label: 'Event Name',
  description: 'Name of the event',
  type: 'string',
  required: true,
  default: { '@path': '$.event' }
}
```

**Timestamp:**

```typescript
timestamp: {
  label: 'Timestamp',
  description: 'When the event occurred',
  type: 'datetime',
  required: false,
  default: { '@path': '$.timestamp' }
}
```

**Properties (Object):**

```typescript
properties: {
  label: 'Event Properties',
  description: 'Additional properties for the event',
  type: 'object',
  required: false,
  default: { '@path': '$.properties' }
}
```

**Array Field:**

```typescript
tags: {
  label: 'Tags',
  description: 'List of tags',
  type: 'string',
  multiple: true,
  required: false
}
```

**Enum Field:**

```typescript
status: {
  label: 'Status',
  description: 'User status',
  type: 'string',
  required: false,
  choices: [
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]
}
```

**Nested Object:**

```typescript
address: {
  label: 'Address',
  description: 'User address',
  type: 'object',
  properties: {
    street: {
      label: 'Street',
      type: 'string'
    },
    city: {
      label: 'City',
      type: 'string'
    },
    country: {
      label: 'Country',
      type: 'string'
    }
  }
}
```

### {{PERFORM_IMPLEMENTATION}}

The main action logic. Map payload fields to API request:

**Simple POST:**

```typescript
return request('{{API_ENDPOINT}}', {
  method: 'POST',
  json: {
    {{FIELD_MAPPINGS}}
  }
})
```

**With URL Parameters:**

```typescript
return request(`{{API_ENDPOINT}}/${payload.userId}`, {
  method: 'PUT',
  json: {
    {{FIELD_MAPPINGS}}
  }
})
```

**Field Mappings Example:**

```typescript
json: {
  user_id: payload.userId,
  email: payload.email,
  event_name: payload.event,
  timestamp: payload.timestamp,
  properties: payload.properties
}
```

**With Transformation:**

```typescript
return request('{{API_ENDPOINT}}', {
  method: 'POST',
  json: {
    user_id: payload.userId,
    email: payload.email,
    // TODO: Verify timestamp format matches API expectations
    timestamp: payload.timestamp ? new Date(payload.timestamp).toISOString() : undefined,
    custom_properties: payload.properties
  }
})
```

### {{PERFORM_BATCH}}

If batch is supported, add performBatch function:

```typescript
,

  performBatch: (request, { payload, settings }) => {
    return request('{{API_ENDPOINT}}', {
      method: 'POST',
      json: {
        events: payload.map(event => ({
          {{FIELD_MAPPINGS}}
        }))
      }
    })
  }
```

Or if batch uses a different endpoint:

```typescript
,

  performBatch: (request, { payload, settings }) => {
    return request('{{BATCH_ENDPOINT}}', {
      method: 'POST',
      json: payload.map(event => ({
        {{FIELD_MAPPINGS}}
      }))
    })
  }
```

## Special Cases

### Conditional Fields

If a field should only be sent under certain conditions:

```typescript
perform: (request, { payload, settings }) => {
  const body: Record<string, any> = {
    user_id: payload.userId,
    event: payload.event
  }

  // Only include email if provided
  if (payload.email) {
    body.email = payload.email
  }

  // TODO: Add any other conditional logic

  return request('{{API_ENDPOINT}}', {
    method: 'POST',
    json: body
  })
}
```

### Complex Transformations

If the API requires complex data transformations:

```typescript
perform: (request, { payload, settings }) => {
  // TODO: Verify this transformation matches API expectations
  const transformedData = {
    user_id: payload.userId,
    event_data: {
      name: payload.event,
      timestamp: new Date(payload.timestamp).getTime(), // Convert to Unix timestamp
      properties: Object.entries(payload.properties || {}).map(([key, value]) => ({
        key,
        value: String(value)
      }))
    }
  }

  return request('{{API_ENDPOINT}}', {
    method: 'POST',
    json: transformedData
  })
}
```

### Error Handling

For actions that need specific error handling:

```typescript
perform: (request, { payload, settings }) => {
  return request('{{API_ENDPOINT}}', {
    method: 'POST',
    json: {
      user_id: payload.userId,
      event: payload.event
    }
  }).catch((error) => {
    // TODO: Customize error handling for API-specific errors
    // Example: if (error.response?.status === 400) { throw new IntegrationError(...) }
    throw error
  })
}
```

## Notes

- Always use TypeScript types from generated-types
- Use payload and settings from context
- Map Segment field names to API field names
- Add TODO comments for complex logic
- Use optional chaining for nullable fields
- Consider adding validation for required API constraints
