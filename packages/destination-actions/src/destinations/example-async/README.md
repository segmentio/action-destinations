# Example Async Destination

This destination demonstrates how to implement asynchronous actions in Segment's destination actions framework. It shows how to handle APIs that work asynchronously and require polling for completion status.

## Async Action Support

### Overview

The async action support allows destinations to:

1. **Submit operations** that return immediately with an operation ID
2. **Store context** using `stateContext` for persistence between requests
3. **Poll for status** using a unified polling method that handles both single and batch operations
4. **Handle results** with comprehensive status tracking and error handling

### Key Components

#### AsyncActionResponseType

```typescript
{
  isAsync: true,
  asyncContexts: JSONLikeObject[], // Unified array for single/batch operations
  message?: string,
  status?: number
}
```

#### AsyncPollResponseType

```typescript
{
  results: AsyncOperationResult[],      // Results for each operation
  overallStatus: 'pending' | 'completed' | 'failed' | 'partial',
  shouldContinuePolling: boolean,
  message?: string
}
```

### Implementation Pattern

1. **perform/performBatch** methods check if the API response indicates async processing
2. If async, return `AsyncActionResponseType` with operation contexts in the `asyncContexts` array
3. The framework automatically calls the **poll** method with the stored contexts
4. **poll** method handles both single operations (1 element array) and batch operations (multiple elements)

### Example Usage

```typescript
// Single operation
perform: async (request, { settings, payload, stateContext }) => {
  const response = await request(`${settings.endpoint}/operations`, {
    method: 'post',
    json: payload
  })

  if (response.data?.status === 'accepted') {
    // Store context if needed
    stateContext?.setResponseContext('operation_id', response.data.operation_id, { hour: 24 })

    return {
      isAsync: true,
      asyncContexts: [
        {
          operation_id: response.data.operation_id,
          user_id: payload.user_id,
          operation_type: payload.operation_type
        }
      ],
      message: `Operation ${response.data.operation_id} submitted`,
      status: 202
    }
  }

  return response // Synchronous response
}

// Unified polling for both single and batch operations
poll: async (request, { settings, asyncContext }) => {
  const asyncContexts = asyncContext?.asyncContexts || []
  const results = []

  // Poll each operation in the array
  for (const context of asyncContexts) {
    const response = await request(`${settings.endpoint}/operations/${context.operation_id}`)

    results.push({
      status: response.data.status === 'completed' ? 'completed' : 'pending',
      progress: response.data.progress || 0,
      message: `Operation ${context.operation_id} is ${response.data.status}`,
      shouldContinuePolling: response.data.status !== 'completed',
      context
    })
  }

  // Determine overall status
  const completedCount = results.filter((r) => r.status === 'completed').length
  const pendingCount = results.filter((r) => r.status === 'pending').length

  return {
    results,
    overallStatus: pendingCount > 0 ? 'pending' : 'completed',
    shouldContinuePolling: pendingCount > 0,
    message:
      results.length === 1
        ? results[0].message
        : `${results.length} operations: ${completedCount} completed, ${pendingCount} pending`
  }
}
```

### Key Benefits

- **Unified Design**: Single poll method handles both individual and batch operations seamlessly
- **Flexible Context**: `asyncContexts` array works for any number of operations (1 for single, N for batch)
- **State Persistence**: Integration with existing `stateContext` for reliable context storage
- **Comprehensive Status**: Detailed operation tracking with progress, errors, and completion status
- **Backward Compatible**: Existing synchronous actions continue to work unchanged

### Testing

The example includes comprehensive tests showing:

- Synchronous operation handling (returns regular response)
- Async operation submission (returns AsyncActionResponseType)
- Batch operation handling (multiple operation IDs)
- Single operation polling (1 element in asyncContexts array)
- Multiple operation polling (N elements in asyncContexts array)
- Error handling and status aggregation
