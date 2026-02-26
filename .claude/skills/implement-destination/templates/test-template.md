# Test Template

This template is used to generate test files for actions.

## Action Test Template

File: `[action-name]/__tests__/index.test.ts`

```typescript
import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('{{DESTINATION_NAME}}.{{ACTION_NAME}}', () => {
  describe('{{ACTION_NAME}}', () => {
    it('should {{TEST_DESCRIPTION}}', async () => {
      {{NOCK_SETUP}}

      const event = createTestEvent({{TEST_EVENT}})

      const mapping = {{TEST_MAPPING}}

      const responses = await testDestination.testAction('{{ACTION_NAME}}', {
        event,
        mapping,
        useDefaultMappings: true,
        settings: {{TEST_SETTINGS}}
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe({{EXPECTED_STATUS}})
      {{ADDITIONAL_ASSERTIONS}}
    })

    {{ADDITIONAL_TESTS}}
  })
})
```

## Placeholders

### {{DESTINATION_NAME}}

Destination name (e.g., "Acme Marketing")

### {{ACTION_NAME}}

Action name in camelCase (e.g., "trackEvent", "identifyUser")

### {{TEST_DESCRIPTION}}

Description of what the test does (e.g., "successfully send a track event")

### {{NOCK_SETUP}}

Nock interceptor for API mock:

**POST Request:**

```typescript
nock('{{BASE_URL}}').post('{{ENDPOINT_PATH}}').reply(200, { success: true })
```

**With Request Body Validation:**

```typescript
nock('{{BASE_URL}}')
  .post('{{ENDPOINT_PATH}}', {
    user_id: 'test-user-123',
    event: 'Test Event'
  })
  .reply(200, { success: true })
```

**With Custom Matcher:**

```typescript
nock('{{BASE_URL}}')
  .post('{{ENDPOINT_PATH}}', (body) => {
    // Custom validation
    return body.user_id === 'test-user-123'
  })
  .reply(200, { success: true })
```

### {{TEST_EVENT}}

Test event data:

**Track Event:**

```typescript
{
  type: 'track',
  event: 'Test Event',
  userId: 'test-user-123',
  timestamp: '2024-01-01T00:00:00.000Z',
  properties: {
    property1: 'value1',
    property2: 'value2'
  }
}
```

**Identify Event:**

```typescript
{
  type: 'identify',
  userId: 'test-user-123',
  traits: {
    email: 'test@example.com',
    name: 'Test User'
  }
}
```

**Group Event:**

```typescript
{
  type: 'group',
  userId: 'test-user-123',
  groupId: 'test-group-456',
  traits: {
    name: 'Test Company'
  }
}
```

### {{TEST_MAPPING}}

Field mappings for test (usually using default mappings):

**Use Defaults:**

```typescript
{
}
```

**Custom Mapping:**

```typescript
{
  userId: { '@path': '$.userId' },
  email: { '@path': '$.traits.email' },
  event: { '@path': '$.event' }
}
```

### {{TEST_SETTINGS}}

Authentication settings for test:

**API Key:**

```typescript
{
  apiKey: 'test_api_key'
}
```

**Basic Auth:**

```typescript
{
  username: 'test_username',
  password: 'test_password'
}
```

### {{EXPECTED_STATUS}}

Expected HTTP status code (usually 200 or 201)

### {{ADDITIONAL_ASSERTIONS}}

Additional test assertions:

**Verify Request:**

```typescript
expect(responses[0].options.json).toMatchObject({
  user_id: 'test-user-123',
  event: 'Test Event'
})
```

**Verify Headers:**

```typescript
expect(responses[0].options.headers).toMatchObject({
  Authorization: 'Bearer test_api_key'
})
```

### {{ADDITIONAL_TESTS}}

Additional test cases:

**Error Handling:**

```typescript
it('should handle API errors gracefully', async () => {
  nock('{{BASE_URL}}').post('{{ENDPOINT_PATH}}').reply(400, { error: 'Bad Request' })

  const event = createTestEvent({
    type: 'track',
    event: 'Test Event'
  })

  await expect(
    testDestination.testAction('{{ACTION_NAME}}', {
      event,
      mapping: {},
      useDefaultMappings: true,
      settings: { apiKey: 'test_key' }
    })
  ).rejects.toThrowError()
})
```

**Required Fields:**

```typescript
it('should fail when required field is missing', async () => {
  const event = createTestEvent({
    type: 'track',
    event: 'Test Event'
    // Missing userId
  })

  await expect(
    testDestination.testAction('{{ACTION_NAME}}', {
      event,
      mapping: { userId: { '@path': '$.userId' } },
      settings: { apiKey: 'test_key' }
    })
  ).rejects.toThrowError()
})
```

**Batch Test:**

```typescript
it('should send batch of events', async () => {
  nock('{{BASE_URL}}').post('{{BATCH_ENDPOINT}}').reply(200, { success: true })

  const events = [
    createTestEvent({ type: 'track', event: 'Event 1', userId: 'user-1' }),
    createTestEvent({ type: 'track', event: 'Event 2', userId: 'user-2' })
  ]

  const responses = await testDestination.testBatchAction('{{ACTION_NAME}}', {
    events,
    mapping: {},
    useDefaultMappings: true,
    settings: { apiKey: 'test_key' }
  })

  expect(responses.length).toBe(1)
  expect(responses[0].status).toBe(200)
})
```

## Destination Test Template

File: `__tests__/index.test.ts`

```typescript
import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

describe('{{DESTINATION_NAME}}', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('{{BASE_URL}}')
        .get('{{TEST_AUTH_ENDPOINT}}')
        .reply(200, {})

      const authData = {{AUTH_DATA}}

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should throw error for invalid credentials', async () => {
      nock('{{BASE_URL}}')
        .get('{{TEST_AUTH_ENDPOINT}}')
        .reply(401, { error: 'Unauthorized' })

      const authData = {{AUTH_DATA}}

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
```

### Auth Data Examples

**API Key:**

```typescript
{
  apiKey: 'test_api_key'
}
```

**Basic Auth:**

```typescript
{
  username: 'test_username',
  password: 'test_password'
}
```

## Notes

- Use `nock` for HTTP mocking
- Use `createTestEvent` for generating Segment events
- Use `createTestIntegration` for destination testing
- Test both success and error cases
- Verify request bodies and headers
- Test required field validation
- Add batch tests if action supports batching
- Mock authentication endpoint for destination tests
