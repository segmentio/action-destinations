# Unified Async Actions Implementation Summary

## Overview

This implementation adds async action support to Segment's destination actions framework using a unified array-based approach that elegantly handles both single and batch operations with a single polling method.

## ✅ Implemented Features

### Core Async Support - Unified Design

- **AsyncActionResponseType**: Unified response with `asyncContexts: JSONLikeObject[]` array
  - Single operations: array with 1 element
  - Batch operations: array with N elements
- **AsyncPollResponseType**: Unified polling response with `results: AsyncOperationResult[]`
- **AsyncOperationResult**: Individual operation status with context preservation

### Action Interface Enhancements

- Added single `poll` method to ActionDefinition (handles both single and batch)
- Extended `ExecuteInput` to include `asyncContext` parameter
- Updated parseResponse to handle async responses correctly
- Eliminated complexity of separate single/batch methods

### Framework Integration

- **Action Class**: Added `hasPollSupport` property
- **Action Class**: Added `executePoll` method (unified for single and batch)
- **Destination Class**: Added `executePoll` method
- Full integration with existing error handling and validation

### State Context Integration

Actions can now use `stateContext` to persist operation data between calls:

```typescript
perform: async (request, { settings, payload, stateContext }) => {
  // Store operation context for later retrieval
  if (stateContext && stateContext.setResponseContext) {
    stateContext.setResponseContext('operation_id', operationId, { hour: 24 })
  }

  return {
    isAsync: true,
    asyncContexts: [{ operation_id: operationId }],
    message: 'Operation submitted',
    status: 202
  }
}
```

### Batch Operations Support

Full support for APIs that return multiple operation IDs:

```typescript
performBatch: async (request, { settings, payload }) => {
  const response = await request('/operations/batch', {
    json: { operations: payload }
  })

  if (response.data?.operation_ids) {
    return {
      isAsync: true,
      asyncContexts: response.data.operation_ids.map((id, index) => ({
        operation_id: id,
        batch_index: index,
        user_id: payload[index]?.user_id
      })),
      message: `${response.data.operation_ids.length} operations submitted`,
      status: 202
    }
  }
}
```

### Unified Polling

Single polling method handles both individual and batch operations seamlessly:

```typescript
poll: async (request, { settings, asyncContext }) => {
  const asyncContexts = asyncContext?.asyncContexts || []
  const results = []

  // Poll each operation in the array (1 for single, N for batch)
  for (const context of asyncContexts) {
    const result = await pollSingleOperation(context.operation_id)
    results.push({
      ...result,
      context
    })
  }

  // Aggregate results for unified response
  return {
    results,
    overallStatus: determineOverallStatus(results),
    shouldContinuePolling: results.some((r) => r.shouldContinuePolling),
    message: results.length === 1 ? results[0].message : `${results.length} operations: ${getStatusCounts(results)}`
  }
}
```

## 📁 File Structure

```
packages/
├── core/src/destination-kit/
│   ├── types.ts                    # New async types
│   ├── action.ts                   # Enhanced Action class
│   └── index.ts                    # Enhanced Destination class
├── core/src/index.ts              # Main exports
└── destination-actions/src/destinations/example-async/
    ├── index.ts                   # Example destination
    ├── asyncOperation/
    │   ├── index.ts              # Complete async action example
    │   └── generated-types.ts    # Action payload types
    ├── generated-types.ts        # Destination settings types
    └── __tests__/
        └── asyncOperation.test.ts # Comprehensive tests
```

## 🧪 Testing

The implementation includes comprehensive tests covering:

- ✅ Synchronous operations (backward compatibility)
- ✅ Single async operations (1 element in asyncContexts array)
- ✅ Batch async operations (N elements in asyncContexts array)
- ✅ Unified polling method handling both single and batch scenarios
- ✅ Error handling and status aggregation
- ✅ State context integration (when available)

## 🔄 Usage Examples

### Single Async Operation

```typescript
// Submit single operation
const result = await destination.executeAction('myAction', { event, mapping, settings })
if (result.isAsync) {
  const asyncContexts = result.asyncContexts // Array with 1 element
  // Poll later using the same unified method...
}

// Poll single operation (same method as batch!)
const pollResult = await destination.executePoll('myAction', {
  event,
  mapping,
  settings,
  asyncContext: {
    asyncContexts: [{ operation_id: 'op_123', user_id: 'user1' }]
  }
})
```

### Batch Async Operation

```typescript
// Submit batch operations
const result = await destination.executeBatch('myAction', { events, mapping, settings })
if (result.isAsync) {
  const asyncContexts = result.asyncContexts // Array with N elements
  // Poll later using the same unified method...
}

// Poll batch operations (same method as single!)
const pollResult = await destination.executePoll('myAction', {
  events,
  mapping,
  settings,
  asyncContext: { asyncContexts: result.asyncContexts }
})

// Unified response structure for both cases
console.log(`Overall status: ${pollResult.overallStatus}`)
pollResult.results.forEach((result, index) => {
  console.log(`Operation ${index}: ${result.status}`)
})
```

## 🎯 Key Benefits

1. **Unified Design**: Single poll method handles both single and batch operations seamlessly
2. **Simplified Architecture**: No separate pollBatch method - eliminated complexity
3. **Flexible Context**: Array structure works for any number of operations (1 for single, N for batch)
4. **Full Backward Compatibility**: Existing synchronous actions continue to work unchanged
5. **State Context Integration**: Leverage existing state persistence mechanisms
6. **Type Safety**: Full TypeScript support for all async operations
7. **Comprehensive Status**: Detailed operation tracking with aggregated results
8. **Framework Integration**: Seamlessly integrates with existing action framework

## 🔮 Future Enhancements

- Automatic retry logic with exponential backoff
- Built-in timeout management for long-running operations
- Enhanced test framework support for async responses
- Metrics and monitoring for async operation performance
- Smart polling interval optimization based on operation types

## 🚀 Ready for Production

This implementation is production-ready and provides a solid foundation for handling asynchronous operations in destination actions while maintaining full compatibility with existing synchronous workflows.
