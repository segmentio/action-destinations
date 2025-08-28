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
  message?: string,
  status?: number
}
```

#### AsyncPollResponseType

```typescript
{
  results: AsyncOperationResult[],      // Results for each operation
  overallStatus: 'pending' | 'completed' | 'failed' | 'partial',
  message?: string
}
```

### Implementation Pattern

1. **perform/performBatch** methods check if the API response indicates async processing
2. If async, store operation contexts in `stateContext` and return `AsyncActionResponseType`
3. The framework automatically calls the **poll** method which reads contexts from `stateContext`
4. **poll** method handles both single operations (1 context) and batch operations (multiple contexts)

### Example Usage

```typescript
// Single operation
perform: async (request, { settings, payload, stateContext }) => {
  const response = await request(`${settings.endpoint}/operations`, {
    method: 'post',
    json: payload
  })

  if (response.data?.status === 'accepted') {
    // Store operation context in stateContext
    if (stateContext?.setResponseContext) {
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

  return response // Synchronous response
}

// Unified polling for both single and batch operations
poll: async (request, { settings, stateContext }) => {
  // Read operation contexts from stateContext
  let asyncContexts: any[] = []
  if (stateContext?.getRequestContext) {
    const storedContexts = stateContext.getRequestContext('async_operations')
    if (storedContexts) {
      asyncContexts = JSON.parse(storedContexts)
    }
  }

  const results = []

  // Poll each operation in the array (1 for single, N for batch)
  for (const context of asyncContexts) {
    const response = await request(`${settings.endpoint}/operations/${context.operation_id}`)

    results.push({
      status: response.data.status === 'completed' ? 'completed' : 'pending',
      message: `Operation ${context.operation_id} is ${response.data.status}`,
      context
    })
  }

  // Determine overall status
  const completedCount = results.filter((r) => r.status === 'completed').length
  const pendingCount = results.filter((r) => r.status === 'pending').length

  return {
    results,
    overallStatus: pendingCount > 0 ? 'pending' : 'completed',
    message:
      results.length === 1
        ? results[0].message
        : `${results.length} operations: ${completedCount} completed, ${pendingCount} pending`
  }
}
```

### Key Benefits

- **Unified Design**: Single poll method handles both individual and batch operations seamlessly
- **Flexible Context**: JSON serialized array in `stateContext` works for any number of operations (1 for single, N for batch)
- **State Persistence**: Integration with existing `stateContext` for reliable context storage
- **Comprehensive Status**: Detailed operation tracking with progress, errors, and completion status
- **Backward Compatible**: Existing synchronous actions continue to work unchanged

### Testing

The example includes comprehensive tests showing:

- Synchronous operation handling (returns regular response)
- Async operation submission (returns AsyncActionResponseType)
- Batch operation handling (multiple operation IDs)
- Single operation polling (1 element stored in stateContext)
- Multiple operation polling (N elements stored in stateContext)
- Error handling and status aggregation
