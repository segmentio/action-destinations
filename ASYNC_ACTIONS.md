# Async Actions for Destination Actions

This document describes the implementation of asynchronous action support for Segment's Action Destinations framework.

## Overview

Previously, all actions in destination frameworks were synchronous - they would immediately return a response from the destination API. However, some destination APIs work asynchronously, accepting a request and then processing it in the background. For these cases, we need a way to:

1. Submit the initial request and receive an operation ID
2. Poll the status of the operation periodically
3. Get the final result when the operation completes

## Implementation

### Core Types

The async action support introduces new types using a unified array structure that handles both single and batch operations seamlessly:

```typescript
// Response type for async operations (unified for single and batch)
export type AsyncActionResponseType = {
  /** Indicates this is an async operation */
  isAsync: true
  /** Optional message about the async operation */
  message?: string
  /** Initial status code */
  status?: number
}

// Individual operation result
export type AsyncOperationResult = {
  /** The current status of this operation */
  status: 'pending' | 'completed' | 'failed'
  /** Message about current state */
  message?: string
  /** Final result data when status is 'completed' */
  result?: JSONLikeObject
  /** Error information when status is 'failed' */
  error?: { code: string; message: string }
  /** The original context for this operation */
  context?: JSONLikeObject
}

// Response type for polling operations (unified for single and batch)
export type AsyncPollResponseType = {
  /** Array of poll results for each operation */
  results: AsyncOperationResult[]
  /** Overall status - completed when all operations are done */
  overallStatus: 'pending' | 'completed' | 'failed' | 'partial'
  /** Summary message */
  message?: string
}
```

### Action Interface Changes

The `ActionDefinition` interface now supports an optional unified `poll` method that handles both single and batch operations:

```typescript
interface ActionDefinition<Settings, Payload, AudienceSettings> {
  // ... existing fields ...

  /** The operation to poll the status of async operations (handles both single and batch) */
  poll?: RequestFn<Settings, Payload, AsyncPollResponseType, AudienceSettings>
}
```

### Execution Context

The `ExecuteInput` type uses existing `stateContext` for poll operations:

```typescript
interface ExecuteInput<Settings, Payload, AudienceSettings> {
  // ... existing fields ...

  /** State context for persisting data between requests */
  readonly stateContext?: StateContext
}
```

## Key Features

### State Context Integration

Async actions integrate with the existing `stateContext` mechanism for persisting data between method calls:

```typescript
perform: async (request, { settings, payload, stateContext }) => {
  // Submit operation and store context in state
  const response = await request(`${settings.endpoint}/operations`, {
    method: 'post',
    json: payload
  })

  if (response.data?.status === 'accepted' && response.data?.operation_id) {
    // Store operation context in state
    if (stateContext && stateContext.setResponseContext) {
      const operationContext = [
        {
          operation_id: response.data.operation_id,
          user_id: payload.user_id,
          operation_type: payload.operation_type
        }
      ]
      stateContext.setResponseContext('async_operations', JSON.stringify(operationContext), { hour: 24 })
    }

    return {
      isAsync: true,
      message: `Operation ${response.data.operation_id} submitted`,
      status: 202
    }
  }

  return response
}
```

### Batch Async Operations

Actions can handle batch operations that return multiple operation IDs:

```typescript
performBatch: async (request, { settings, payload, stateContext }) => {
  const response = await request(`${settings.endpoint}/operations/batch`, {
    method: 'post',
    json: { operations: payload }
  })

  if (response.data?.status === 'accepted' && response.data?.operation_ids) {
    // Store batch operation contexts in state
    if (stateContext && stateContext.setResponseContext) {
      const operationContexts = response.data.operation_ids.map((operationId: string, index: number) => ({
        operation_id: operationId,
        user_id: payload[index]?.user_id,
        operation_type: payload[index]?.operation_type,
        batch_index: index
      }))
      stateContext.setResponseContext('async_operations', JSON.stringify(operationContexts), { hour: 24 })
    }

    return {
      isAsync: true,
      message: `Batch operations submitted: ${response.data.operation_ids.join(', ')}`,
      status: 202
    } as AsyncActionResponseType
  }

  return response
}
```

## Usage

### 1. Implementing an Async Action

Here's an example of how to implement an action that supports async operations:

```typescript
const action: ActionDefinition<Settings, Payload> = {
  title: 'Async Operation',
  description: 'An action that performs async operations',
  fields: {
    // ... field definitions ...
  },

  perform: async (request, { settings, payload, stateContext }) => {
    const response = await request(`${settings.endpoint}/operations`, {
      method: 'post',
      json: payload
    })

    if (response.data?.status === 'accepted' && response.data?.operation_id) {
      // Set context data for polling
      stateContext.setResponseContext('operation_id', response.data.operation_id, { hour: 24 })

      return {
        isAsync: true,
        message: `Operation submitted`,
        status: 202
      }
    }

    return response
  },

  poll: async (request, { settings, stateContext }) => {
    // Get context data from perform/performBatch
    const operationId = stateContext.getRequestContext('operation_id')

    // Use context data to query your destination API
    const response = await request(`${settings.endpoint}/operations/${operationId}`)

    return {
      results: [
        {
          status: response.data.status,
          shouldContinuePolling: response.data.status === 'pending'
        }
      ],
      overallStatus: response.data.status
    }
  }
}
```

### 2. Checking for Async Support

You can check if an action supports async operations:

```typescript
const action = new Action(destinationName, definition)
if (action.hasPollSupport) {
  console.log('This action supports async operations')
}
```

### 3. Executing Async Operations

**Initial Submission:**

```typescript
const result = await destination.executeAction('myAction', {
  event,
  mapping,
  settings
})

// Check if it's an async operation
if (result.isAsync) {
  // Operation context is automatically stored in stateContext
  // No need to manually handle context - polling will retrieve from stateContext
}
```

**Polling for Status:**

```typescript
const pollResult = await destination.executePoll('myAction', {
  event,
  mapping,
  settings
  // stateContext is automatically passed - no need to specify async context
})

// Check overall status and individual results
if (pollResult.overallStatus === 'completed') {
  console.log('All operations completed')
  pollResult.results.forEach((result, index) => {
    console.log(`Operation ${index}:`, result.result)
  })
} else if (pollResult.overallStatus === 'failed') {
  console.error('Some operations failed')
  pollResult.results.forEach((result, index) => {
    if (result.status === 'failed') {
      console.error(`Operation ${index} failed:`, result.error)
    }
  })
} else if (pollResult.shouldContinuePolling) {
  // Schedule another poll
  setTimeout(() => poll(), 5000)
}
```

## Framework Integration

### Action Class Changes

The `Action` class now includes:

- `hasPollSupport: boolean` - indicates if the action supports polling
- `executePoll()` method - executes the poll operation

### Destination Class Changes

The `Destination` class now includes:

- `executePoll()` method - executes polling for a specific action

## Error Handling

Async actions should handle several error scenarios:

1. **Missing Async Context:** When poll is called without required context data
2. **Invalid Operation ID:** When the operation ID is not found
3. **Network Errors:** When polling requests fail
4. **Timeout:** When operations take too long

## Best Practices

1. **Always validate async context** in the poll method
2. **Include meaningful progress indicators** when possible
3. **Set appropriate polling intervals** to avoid overwhelming the destination API
4. **Handle all possible operation states** (pending, completed, failed, unknown)
5. **Provide clear error messages** for debugging
6. **Store minimal context** needed for polling to reduce memory usage

## Testing

Testing async actions requires special consideration:

```typescript
describe('Async Action', () => {
  it('should handle async operations', async () => {
    // Test that async operations return proper async response
    const responses = await testDestination.testAction('asyncOperation', {
      event,
      mapping,
      settings
    })

    // Verify the destination API was called correctly
    expect(responses[0].data.status).toBe('accepted')
    expect(responses[0].data.operation_id).toBeDefined()
  })

  // Note: Direct poll testing requires calling the poll method directly
  // as the test framework doesn't support async response handling yet
})
```

## Example Implementation

See `/packages/destination-actions/src/destinations/example-async/` for a complete working example of an async action implementation.

## Future Enhancements

1. **Automatic Polling:** Framework could handle polling automatically
2. **Exponential Backoff:** Built-in retry logic with backoff
3. **Timeout Management:** Automatic timeout handling
4. **Test Framework Integration:** Better support for testing async responses
5. **Enhanced Error Recovery:** Smarter retry logic for failed operations

## Migration Guide

To add async support to an existing destination:

1. Add the `poll` method to your action definition
2. Modify the `perform` method to return `AsyncActionResponseType` when appropriate
3. Update your destination settings if needed for polling endpoints
4. Add tests for both sync and async code paths
5. Update documentation to explain async behavior to users
