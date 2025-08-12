# Async Actions Support

This document describes the async actions feature that allows destination actions to handle long-running operations asynchronously.

## Overview

Async actions enable destinations to initiate operations that may take a significant amount of time to complete without blocking the request/response cycle. This is particularly useful for:

- Bulk data processing operations
- Large file uploads
- Complex data transformations
- Operations that require multiple API calls
- Processes that may timeout with synchronous execution

Async actions support two modes:

1. **Single Operation Mode**: One async operation per batch
2. **Multi-Operation Mode**: Multiple async operations per batch (when payload needs to be split)

## How Async Actions Work

### 1. Async Operation Initiation

When `performBatch` is called for an async action, it can:

#### Single Operation Mode

1. Initiates one operation for the entire batch with the external service
2. Returns an `AsyncOperationResponse` containing operation details
3. The framework returns a 202 Accepted status to indicate async processing has begun

#### Multi-Operation Mode

1. Splits the batch into multiple operations (e.g., by record type, size limits, etc.)
2. Returns a `MultiAsyncOperationResponse` containing multiple operation details
3. The framework returns 202 Accepted status with all operation details

### 2. Status Polling

The system can periodically call the polling methods to check operation status:

#### Single Operation Polling

1. `poll` is called with the operation ID from the initial response
2. The method returns current status and any available results

#### Multi-Operation Polling

1. `pollMultiple` is called with multiple operation IDs from the initial response
2. The method returns status for all operations and aggregated results

### 3. Context Data Passing

Async actions support passing context data from `performBatch` to polling methods using `stateContext`:

#### How Context Works

1. **performBatch** stores context data using `stateContext`:

   - Use `stateContext?.setResponseContext?.(operationId, contextData, {})` to store data
   - The operationId serves as the key for the stored context

2. **Polling methods** retrieve context data using `stateContext`:
   - Use `stateContext?.getRequestContext?.(operationId)` to retrieve stored data
   - The same stateContext is passed to poll methods

#### Context Use Cases

- Store API endpoints specific to the operation
- Pass processing metadata (priority, retry policies, etc.)
- Include batch-specific configuration
- Store timestamps for timeout calculations
- Pass authentication tokens or session data

```typescript
// Example: performBatch storing context with stateContext
async performBatch(request, data) {
  const operationId = await initiateAsyncOperation(data)

  // Store context data using stateContext
  const contextData = {
    apiEndpoint: 'https://api.example.com/process',
    batchSize: data.payload.length,
    priority: 'high',
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    createdAt: new Date().toISOString()
  }
  data.stateContext?.setResponseContext?.(operationId, contextData, {})

  return {
    operationId,
    status: 'pending'
  }
}

// Example: poll using context from stateContext
async poll(request, data) {
  const { operationId, stateContext } = data

  // Retrieve context data that was stored in performBatch
  const context = stateContext?.getRequestContext?.(operationId)
  const endpoint = context?.apiEndpoint || 'https://api.example.com/default'

  const response = await request.get(`${endpoint}/status/${operationId}`, {
    headers: {
      'X-Priority': context?.priority,
      'X-Batch-Size': context?.batchSize?.toString()
    }
  })

  return {
    status: response.data.status,
    result: response.data.result
  }
}

// Example: pollMultiple using context from stateContext
async pollMultiple(request, data) {
  const { operationIds, stateContext } = data

  const results = await Promise.all(
    operationIds.map(async (operationId) => {
      // Get context for each operation
      const context = stateContext?.getRequestContext?.(operationId)
      const endpoint = context?.apiEndpoint || 'https://api.example.com/default'

      const response = await request.get(`${endpoint}/status/${operationId}`)
      return {
        operationId,
        status: response.data.status,
        result: response.data.result
      }
    })
  )

  return {
    overallStatus: 'completed',
    results
  }
}
```

#### StateContext Benefits

- **Persistence**: Data persists across different method calls
- **Scalability**: Can store different context for each operation
- **Flexibility**: No need to modify response formats
- **Consistency**: Same pattern used throughout the Segment ecosystem

3. Polling continues until all operations complete or any operation fails

## Implementation

### ActionDefinition Interface

```typescript
interface ActionDefinition<Settings, Payload, AudienceSettings> {
  // ... existing fields ...

  /**
   * Optional: The operation to poll for the status of an async operation initiated by performBatch.
   * This method is only required if performBatch returns AsyncOperationResponse.
   */
  poll?: (request: RequestClient, data: PollInput<Settings, AudienceSettings>) => MaybePromise<PollResponse>

  /**
   * Optional: The operation to poll for the status of multiple async operations initiated by performBatch.
   * This method is only required if performBatch returns MultiAsyncOperationResponse.
   */
  pollMultiple?: (
    request: RequestClient,
    data: MultiPollInput<Settings, AudienceSettings>
  ) => MaybePromise<MultiPollResponse>
}
```

### New Types

#### Single Operation Types

##### AsyncOperationResponse

Returned by `performBatch` to indicate an async operation has been initiated:

```typescript
interface AsyncOperationResponse {
  /** Unique identifier for the async operation */
  operationId: string
  /** Status of the async operation */
  status: 'pending' | 'completed' | 'failed'
  /** Optional message describing the operation status */
  message?: string
  /** Optional data related to the operation */
  data?: JSONLikeObject
}
```

##### PollInput

Input data provided to the `poll` method:

```typescript
interface PollInput<Settings, AudienceSettings = unknown> {
  /** The operation ID to poll for */
  operationId: string
  /** The global destination settings */
  settings: Settings
  /** The audience-specific destination settings */
  audienceSettings?: AudienceSettings
  /** The data needed in OAuth requests */
  auth?: AuthTokens
  /** For internal Segment/Twilio use only */
  features?: Features
  statsContext?: StatsContext
  logger?: Logger
}
```

##### PollResponse

Response from the `poll` method indicating current operation status:

```typescript
interface PollResponse {
  /** Status of the async operation */
  status: 'pending' | 'completed' | 'failed'
  /** Optional message describing the operation status */
  message?: string
  /** Optional result data when operation is completed */
  result?: JSONLikeObject
  /** Optional error details when operation fails */
  error?: {
    message: string
    code?: string
  }
}
```

#### Multi-Operation Types

##### MultiAsyncOperationResponse

Returned by `performBatch` when splitting into multiple async operations:

```typescript
interface MultiAsyncOperationResponse {
  /** Array of operation details */
  operations: Array<{
    /** Unique identifier for this operation */
    operationId: string
    /** Status of this operation */
    status: 'pending' | 'completed' | 'failed'
    /** Indices of payload items handled by this operation */
    payloadIndices: number[]
    /** Optional message for this operation */
    message?: string
  }>
  /** Overall message for the batch split */
  message?: string
}
```

##### MultiPollInput

Input data provided to the `pollMultiple` method:

```typescript
interface MultiPollInput<Settings, AudienceSettings = unknown> {
  /** Array of operation IDs to poll for */
  operationIds: string[]
  /** The global destination settings */
  settings: Settings
  /** The audience-specific destination settings */
  audienceSettings?: AudienceSettings
  /** The data needed in OAuth requests */
  auth?: AuthTokens
  /** For internal Segment/Twilio use only */
  features?: Features
  statsContext?: StatsContext
  logger?: Logger
}
```

##### MultiPollResponse

Response from the `pollMultiple` method indicating status of all operations:

```typescript
interface MultiPollResponse {
  /** Overall status across all operations */
  overallStatus: 'pending' | 'completed' | 'failed'
  /** Status and results for individual operations */
  results: Array<{
    operationId: string
    status: 'pending' | 'completed' | 'failed'
    result?: JSONLikeObject
    error?: {
      message: string
      code?: string
    }
  }>
  /** Aggregated results for all completed operations */
  payloadResults: JSONLikeObject[]
  /** Optional overall message */
  message?: string
}
```

    message: string
    code?: string

}
}

````

### Action Class Changes

The `Action` class now includes:

- `hasAsyncSupport: boolean` - Indicates if the action supports async operations (either single or multi)
- `executePoll(pollInput: PollInput): Promise<PollResponse>` - Method to poll for single operation status
- `executePollMultiple(pollInput: MultiPollInput): Promise<MultiPollResponse>` - Method to poll for multiple operation statuses
- Enhanced `executeBatch` to handle both `AsyncOperationResponse` and `MultiAsyncOperationResponse` returns

## Example Implementation

### Single Operation Example

```typescript
const asyncAction: ActionDefinition<Settings, Payload> = {
  title: 'Bulk User Sync (Async)',
  description: 'Synchronize user data using async processing',

  fields: {
    // ... field definitions ...
  },

  perform: async (request, { payload, settings }) => {
    // Single event processing (synchronous)
    return await request(`${settings.endpoint}/users`, {
      method: 'POST',
      json: payload
    })
  },

  performBatch: async (request, { payload, settings }) => {
    // Initiate async batch operation
    const response = await request(`${settings.endpoint}/batch/async`, {
      method: 'POST',
      json: { data: payload }
    })

    // Return async operation response
    return {
      operationId: response.data.operationId,
      status: 'pending',
      message: `Batch operation initiated for ${payload.length} records`
    } as AsyncOperationResponse
  },

  poll: async (request, data) => {
    // Check operation status
    const response = await request(`${data.settings.endpoint}/batch/status/${data.operationId}`)
    const statusData = response.data

    switch (statusData.status) {
      case 'completed':
        return {
          status: 'completed',
          message: 'Batch operation completed successfully',
          result: {
            processedRecords: statusData.processedRecords,
            failedRecords: statusData.failedRecords
          }
        }

      case 'failed':
        return {
          status: 'failed',
          message: 'Batch operation failed',
          error: {
            message: statusData.errorMessage,
            code: statusData.errorCode
          }
        }

      default:
        return {
          status: 'pending',
          message: `Operation in progress: ${statusData.progress}% complete`
        }
    }
  }
}
````

### Multi-Operation Example

```typescript
const multiAsyncAction: ActionDefinition<Settings, Payload> = {
  title: 'Mixed Record Sync (Multi-Async)',
  description: 'Synchronize different record types using multiple async operations',

  fields: {
    recordType: {
      label: 'Record Type',
      type: 'string',
      required: true,
      choices: [
        { label: 'User', value: 'user' },
        { label: 'Event', value: 'event' },
        { label: 'Group', value: 'group' }
      ]
    },
    data: {
      label: 'Data',
      type: 'object',
      required: true
    }
  },

  performBatch: async (request, { payload, settings }) => {
    // Group payloads by record type
    const groups = new Map<string, number[]>()

    payload.forEach((item, index) => {
      const recordType = item.recordType
      if (!groups.has(recordType)) {
        groups.set(recordType, [])
      }
      groups.get(recordType).push(index)
    })

    // Create separate operations for each record type
    const operations = []
    for (const [recordType, indices] of groups.entries()) {
      const response = await request(`${settings.endpoint}/${recordType}/batch/async`, {
        method: 'POST',
        json: {
          data: indices.map((i) => payload[i]),
          correlationId: `${recordType}-${Date.now()}`
        }
      })

      operations.push({
        operationId: response.data.operationId,
        status: 'pending' as const,
        payloadIndices: indices,
        message: `${recordType} batch operation initiated`
      })
    }

    return {
      operations,
      message: `Initiated ${operations.length} async operations for different record types`
    } as MultiAsyncOperationResponse
  },

  pollMultiple: async (request, data) => {
    // Poll status of all operations
    const response = await request(`${data.settings.endpoint}/batch/poll`, {
      method: 'POST',
      json: { operationIds: data.operationIds }
    })

    const pollData = response.data as {
      results: Array<{
        operationId: string
        status: 'pending' | 'completed' | 'failed'
        processedRecords?: any[]
        error?: string
      }>
    }

    // Determine overall status
    const allCompleted = pollData.results.every((r) => r.status === 'completed')
    const anyFailed = pollData.results.some((r) => r.status === 'failed')
    const overallStatus = anyFailed ? 'failed' : allCompleted ? 'completed' : 'pending'

    // Build results and payload results
    const results = pollData.results.map((r) => ({
      operationId: r.operationId,
      status: r.status,
      result: r.processedRecords || { error: r.error }
    }))

    // Flatten all processed records in order
    const payloadResults = pollData.results.flatMap((r) => r.processedRecords || [])

    return {
      overallStatus,
      results,
      payloadResults,
      message: `${results.length} operations polled: ${overallStatus}`
    } as MultiPollResponse
  }
}
```

## Usage Flow

### Single Operation Flow

1. **Batch Processing Request**: A batch of events is sent to the action
2. **Async Initiation**: `performBatch` initiates the async operation and returns `AsyncOperationResponse`
3. **Framework Response**: The framework returns 202 Accepted with operation details
4. **Periodic Polling**: The system periodically calls `poll` with the operation ID
5. **Status Updates**: `poll` returns current status, progress, or completion results
6. **Final Resolution**: Operation completes successfully or fails with error details

### Multi-Operation Flow

1. **Batch Processing Request**: A batch of events is sent to the action
2. **Batch Analysis**: `performBatch` analyzes the batch and determines split strategy
3. **Multiple Async Initiation**: Multiple async operations are initiated with external service(s)
4. **Multi-Operation Response**: Returns `MultiAsyncOperationResponse` with all operation details
5. **Framework Response**: The framework returns 202 Accepted with all operation details
6. **Periodic Multi-Polling**: The system periodically calls `pollMultiple` with all operation IDs
7. **Aggregate Status Updates**: `pollMultiple` returns status for all operations and overall progress
8. **Final Resolution**: All operations complete successfully or any operation fails

### Choosing Between Single and Multi-Operation

Use **Single Operation** when:

- The entire batch is processed as one unit
- All records follow the same processing path
- The external API handles the batch atomically

Use **Multi-Operation** when:

- Records need different processing based on type, size, or other criteria
- API has limits requiring batch splitting
- Different record types go to different endpoints
- You want granular progress tracking for different parts of the batch

## Benefits

- **Timeout Prevention**: Long-running operations don't timeout the request
- **Resource Efficiency**: Better CPU and memory utilization
- **Progress Tracking**: Ability to provide real-time progress updates
- **Error Handling**: Detailed error reporting for complex operations
- **Scalability**: Handle larger batches without blocking other operations

## Backward Compatibility

- Existing synchronous actions continue to work unchanged
- The `poll` method is optional - only required if `performBatch` returns `AsyncOperationResponse`
- All existing types and interfaces remain compatible

## Testing

Async actions can be tested using the provided test utilities:

### Single Operation Testing

```typescript
describe('Single Async Action Tests', () => {
  it('should support async operations', async () => {
    const action = new Action('destination', asyncActionDefinition)

    // Verify async support
    expect(action.hasAsyncSupport).toBe(true)

    // Test batch execution
    const batchResult = await action.executeBatch({
      data: mockPayloads,
      settings: mockSettings,
      mapping: fieldMapping,
      auth: undefined
    })

    // Verify async response
    expect(batchResult[0]).toMatchObject({
      status: 202,
      body: expect.objectContaining({
        operationId: expect.any(String),
        status: 'pending'
      })
    })

    // Test polling
    const pollResult = await action.executePoll({
      operationId: 'test-operation-id',
      settings: mockSettings,
      auth: undefined
    })

    expect(pollResult.status).toBeOneOf(['pending', 'completed', 'failed'])
  })
})
```

### Multi-Operation Testing

```typescript
describe('Multi Async Action Tests', () => {
  it('should support multi async operations', async () => {
    const action = new Action('destination', multiAsyncActionDefinition)

    // Verify async support
    expect(action.hasAsyncSupport).toBe(true)

    // Test batch execution with mixed record types
    const batchResult = await action.executeBatch({
      data: [
        { recordType: 'user', data: { name: 'John' } },
        { recordType: 'event', data: { event: 'click' } },
        { recordType: 'user', data: { name: 'Jane' } }
      ],
      settings: mockSettings,
      mapping: fieldMapping,
      auth: undefined
    })

    // Verify multi-async response
    expect(batchResult[0]).toMatchObject({
      status: 202,
      body: expect.objectContaining({
        operations: expect.arrayContaining([
          expect.objectContaining({
            operationId: expect.any(String),
            status: 'pending',
            payloadIndices: expect.any(Array)
          })
        ])
      })
    })

    // Test multi-polling
    const pollResult = await action.executePollMultiple({
      operationIds: ['op-1', 'op-2'],
      settings: mockSettings,
      auth: undefined
    })

    expect(pollResult).toMatchObject({
      overallStatus: expect.stringMatching(/pending|completed|failed/),
      results: expect.arrayContaining([
        expect.objectContaining({
          operationId: expect.any(String),
          status: expect.stringMatching(/pending|completed|failed/)
        })
      ]),
      payloadResults: expect.any(Array)
    })
  })

  it('should handle mixed completion states', async () => {
    // Test scenario where some operations complete and others are still pending
    const pollResult = await action.executePollMultiple({
      operationIds: ['completed-op', 'pending-op', 'failed-op'],
      settings: mockSettings,
      auth: undefined
    })

    // Should reflect mixed states appropriately
    expect(pollResult.overallStatus).toBe('failed') // Any failure = overall failure
    expect(pollResult.results).toHaveLength(3)
    expect(pollResult.results.some((r) => r.status === 'completed')).toBe(true)
    expect(pollResult.results.some((r) => r.status === 'pending')).toBe(true)
    expect(pollResult.results.some((r) => r.status === 'failed')).toBe(true)
  })
})
```
