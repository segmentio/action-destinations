# Async Actions for Destination Actions

This document describes the implementation of asynchronous action support for Segment's Action Destinations framework.

## Overview

Previously, all actions in destination frameworks were synchronous - they would immediately return a response from the destination API. However, some destination APIs work asynchronously, accepting a request and then processing it in the background. For these cases, we need a way to:

1. Submit the initial request and receive an operation ID
2. Poll the status of the operation periodically
3. Get the final result when the operation completes

## Implementation

### Core Types

The async action support introduces several new types:

```typescript
// Response type for async operations
export type AsyncActionResponseType = {
  /** Indicates this is an async operation */
  isAsync: true
  /** Context data to be used for polling operations */
  asyncContext: JSONLikeObject
  /** Optional message about the async operation */
  message?: string
  /** Initial status code */
  status?: number
}

// Response type for polling operations
export type AsyncPollResponseType = {
  /** The current status of the async operation */
  status: 'pending' | 'completed' | 'failed'
  /** Progress indicator (0-100) */
  progress?: number
  /** Message about current state */
  message?: string
  /** Final result data when status is 'completed' */
  result?: JSONLikeObject
  /** Error information when status is 'failed' */
  error?: {
    code: string
    message: string
  }
  /** Whether polling should continue */
  shouldContinuePolling: boolean
}

// Response type for batch async operations
export type BatchAsyncActionResponseType = {
  /** Indicates this is a batch async operation */
  isAsync: true
  /** Array of context data for each operation */
  asyncContexts: JSONLikeObject[]
  /** Optional message about the async operations */
  message?: string
  /** Initial status code */
  status?: number
}

// Response type for batch polling operations
export type BatchAsyncPollResponseType = {
  /** Array of poll results for each operation */
  results: AsyncPollResponseType[]
  /** Overall status - completed when all operations are done */
  overallStatus: 'pending' | 'completed' | 'failed' | 'partial'
  /** Whether any operations should continue polling */
  shouldContinuePolling: boolean
  /** Summary message */
  message?: string
}
```

### Action Interface Changes

The `ActionDefinition` interface now supports optional `poll` and `pollBatch` methods:

```typescript
interface ActionDefinition<Settings, Payload, AudienceSettings> {
  // ... existing fields ...

  /** The operation to poll the status of an async operation */
  poll?: RequestFn<Settings, Payload, AsyncPollResponseType, AudienceSettings>

  /** The operation to poll the status of multiple async operations from a batch */
  pollBatch?: RequestFn<Settings, Payload[], BatchAsyncPollResponseType, AudienceSettings>
}
```

### Execution Context

The `ExecuteInput` type now includes async context for poll operations:

```typescript
interface ExecuteInput<Settings, Payload, AudienceSettings> {
  // ... existing fields ...

  /** Async context data for polling operations */
  readonly asyncContext?: JSONLikeObject
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
    // Store operation context in state for later retrieval
    if (stateContext && stateContext.setResponseContext) {
      stateContext.setResponseContext('operation_id', response.data.operation_id, { hour: 24 })
      stateContext.setResponseContext('user_id', payload.user_id, { hour: 24 })
    }

    return {
      isAsync: true,
      asyncContext: {
        operation_id: response.data.operation_id,
        user_id: payload.user_id
      },
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
    // Store batch context
    if (stateContext && stateContext.setResponseContext) {
      stateContext.setResponseContext('batch_operation_ids', JSON.stringify(response.data.operation_ids), { hour: 24 })
    }

    return {
      isAsync: true,
      asyncContexts: response.data.operation_ids.map((operationId: string, index: number) => ({
        operation_id: operationId,
        user_id: payload[index]?.user_id,
        batch_index: index
      })),
      message: `Batch operations submitted: ${response.data.operation_ids.join(', ')}`,
      status: 202
    } as BatchAsyncActionResponseType
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

  perform: async (request, { settings, payload }) => {
    // Submit the operation to the destination
    const response = await request(`${settings.endpoint}/operations`, {
      method: 'post',
      json: payload
    })

    // Check if this is an async operation
    if (response.data?.status === 'accepted' && response.data?.operation_id) {
      // Return async response with context for polling
      return {
        isAsync: true,
        asyncContext: {
          operation_id: response.data.operation_id,
          user_id: payload.user_id
          // Include any data needed for polling
        },
        message: `Operation ${response.data.operation_id} submitted successfully`,
        status: 202
      } as AsyncActionResponseType
    }

    // Return regular response for synchronous operations
    return response
  },

  poll: async (request, { settings, asyncContext }) => {
    if (!asyncContext?.operation_id) {
      return {
        status: 'failed',
        error: {
          code: 'MISSING_CONTEXT',
          message: 'Operation ID not found in async context'
        },
        shouldContinuePolling: false
      }
    }

    // Poll the operation status
    const response = await request(`${settings.endpoint}/operations/${asyncContext.operation_id}`)
    const operationStatus = response.data?.status

    switch (operationStatus) {
      case 'pending':
      case 'processing':
        return {
          status: 'pending',
          progress: response.data?.progress || 0,
          message: `Operation is ${operationStatus}`,
          shouldContinuePolling: true
        }

      case 'completed':
        return {
          status: 'completed',
          progress: 100,
          message: 'Operation completed successfully',
          result: response.data?.result || {},
          shouldContinuePolling: false
        }

      case 'failed':
        return {
          status: 'failed',
          error: {
            code: response.data?.error_code || 'OPERATION_FAILED',
            message: response.data?.error_message || 'Operation failed'
          },
          shouldContinuePolling: false
        }
    }
  },

  pollBatch: async (request, { settings, asyncContext }) => {
    const asyncContexts = (asyncContext as any)?.asyncContexts || []

    if (!asyncContexts || asyncContexts.length === 0) {
      return {
        results: [],
        overallStatus: 'failed',
        shouldContinuePolling: false,
        message: 'No async contexts found for batch polling'
      }
    }

    // Poll each operation in the batch
    const results = []
    for (const context of asyncContexts) {
      try {
        const response = await request(`${settings.endpoint}/operations/${context.operation_id}`)
        const operationStatus = response.data?.status

        switch (operationStatus) {
          case 'pending':
          case 'processing':
            results.push({
              status: 'pending',
              progress: response.data?.progress || 0,
              message: `Operation ${context.operation_id} is ${operationStatus}`,
              shouldContinuePolling: true
            })
            break
          // ... handle other statuses
        }
      } catch (error) {
        results.push({
          status: 'failed',
          error: { code: 'POLLING_ERROR', message: `Failed to poll: ${error}` },
          shouldContinuePolling: false
        })
      }
    }

    // Determine overall status
    const pendingCount = results.filter((r) => r.status === 'pending').length
    const completedCount = results.filter((r) => r.status === 'completed').length
    const failedCount = results.filter((r) => r.status === 'failed').length

    let overallStatus
    if (completedCount === results.length) {
      overallStatus = 'completed'
    } else if (failedCount === results.length) {
      overallStatus = 'failed'
    } else if (pendingCount > 0) {
      overallStatus = 'pending'
    } else {
      overallStatus = 'partial'
    }

    return {
      results,
      overallStatus,
      shouldContinuePolling: pendingCount > 0,
      message: `Batch status: ${completedCount} completed, ${failedCount} failed, ${pendingCount} pending`
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
  const { operation_id } = result.asyncContext
  // Store operation_id for later polling
}
```

**Polling for Status:**

```typescript
const pollResult = await destination.executePoll('myAction', {
  event,
  mapping,
  settings,
  asyncContext: { operation_id: 'op_12345' }
})

if (pollResult.status === 'completed') {
  console.log('Operation completed:', pollResult.result)
} else if (pollResult.status === 'failed') {
  console.error('Operation failed:', pollResult.error)
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
4. **Batch Polling:** Support for polling multiple operations at once
5. **Test Framework Integration:** Better support for testing async responses

## Migration Guide

To add async support to an existing destination:

1. Add the `poll` method to your action definition
2. Modify the `perform` method to return `AsyncActionResponseType` when appropriate
3. Update your destination settings if needed for polling endpoints
4. Add tests for both sync and async code paths
5. Update documentation to explain async behavior to users
