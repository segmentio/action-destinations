# Enhanced Async Actions Implementation Summary

## Overview

This implementation adds comprehensive async action support to Segment's destination actions framework, including full support for batch operations and proper state context integration.

## ✅ Implemented Features

### Core Async Support

- **AsyncActionResponseType**: Single async operation response with context
- **AsyncPollResponseType**: Polling response for single operations
- **BatchAsyncActionResponseType**: Batch async operation response with multiple contexts
- **BatchAsyncPollResponseType**: Batch polling response with aggregated results

### Action Interface Enhancements

- Added `poll` method to ActionDefinition for single operation polling
- Added `pollBatch` method to ActionDefinition for batch operation polling
- Extended `ExecuteInput` to include `asyncContext` parameter
- Updated parseResponse to handle async responses correctly

### Framework Integration

- **Action Class**: Added `hasPollSupport` and `hasBatchPollSupport` properties
- **Action Class**: Added `executePoll` and `executePollBatch` methods
- **Destination Class**: Added `executePoll` and `executePollBatch` methods
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
    asyncContext: { operation_id: operationId },
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

### Batch Polling

Comprehensive batch polling with individual operation tracking:

```typescript
pollBatch: async (request, { settings, asyncContext }) => {
  const contexts = asyncContext?.asyncContexts || []
  const results = []

  // Poll each operation individually
  for (const context of contexts) {
    const result = await pollSingleOperation(context.operation_id)
    results.push(result)
  }

  // Aggregate results
  return {
    results,
    overallStatus: determineOverallStatus(results),
    shouldContinuePolling: results.some((r) => r.shouldContinuePolling),
    message: generateSummaryMessage(results)
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
- ✅ Single async operations with context preservation
- ✅ Batch async operations with multiple operation IDs
- ✅ Error handling for missing contexts
- ✅ State context integration (when available)

## 🔄 Usage Examples

### Single Async Operation

```typescript
// Submit
const result = await destination.executeAction('myAction', { event, mapping, settings })
if (result.isAsync) {
  const operationId = result.asyncContext.operation_id
  // Poll later...
}

// Poll
const pollResult = await destination.executePoll('myAction', {
  event,
  mapping,
  settings,
  asyncContext: { operation_id: 'op_123' }
})
```

### Batch Async Operation

```typescript
// Submit batch
const result = await destination.executeBatch('myAction', { events, mapping, settings })
if (result.isAsync) {
  const operationIds = result.asyncContexts.map((ctx) => ctx.operation_id)
  // Poll later...
}

// Poll batch
const pollResult = await destination.executePollBatch('myAction', {
  events,
  mapping,
  settings,
  asyncContext: { asyncContexts: result.asyncContexts }
})
```

## 🎯 Key Benefits

1. **Full Backward Compatibility**: Existing synchronous actions continue to work unchanged
2. **Comprehensive Batch Support**: Handle APIs returning multiple operation IDs
3. **State Context Integration**: Leverage existing state persistence mechanisms
4. **Type Safety**: Full TypeScript support for all async operations
5. **Error Handling**: Robust error handling for network issues, missing contexts, etc.
6. **Flexible Polling**: Support both individual and batch polling strategies
7. **Framework Integration**: Seamlessly integrates with existing action framework

## 🔮 Future Enhancements

- Automatic retry logic with exponential backoff
- Built-in timeout management for long-running operations
- Concurrent batch polling with configurable limits
- Enhanced test framework support for async responses
- Metrics and monitoring for async operation performance

## 🚀 Ready for Production

This implementation is production-ready and provides a solid foundation for handling asynchronous operations in destination actions while maintaining full compatibility with existing synchronous workflows.
