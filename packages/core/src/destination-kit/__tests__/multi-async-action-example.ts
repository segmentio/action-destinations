import { Action } from '../action'
import { MultiAsyncOperationResponse, MultiPollResponse, MultiPollInput } from '../types'

// Define the payload type for this example
interface ExamplePayload {
  recordType: 'user' | 'event' | 'group'
  data: any
}

// Example: Multi-operation async action that splits a batch based on record type
const multiAsyncAction = new Action('test-destination', {
  title: 'Multi-Operation Async Action Example',
  description: 'Example action that demonstrates multiple async operations from a single batch',
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

  async performBatch(request: any, data: any) {
    // Group payloads by record type
    const groups = new Map<string, number[]>()

    data.data.forEach((payload: ExamplePayload, index: number) => {
      const recordType = payload.recordType
      if (!groups.has(recordType)) {
        groups.set(recordType, [])
      }
      const group = groups.get(recordType)
      if (group) {
        group.push(index)
      }
    })

    // Create separate operations for each record type
    const operations = Array.from(groups.entries()).map(([recordType, indices]) => {
      const operationId = `${recordType}-batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

      // Store context data in stateContext using operationId as key
      const contextData = {
        recordType,
        batchSize: indices.length,
        createdAt: new Date().toISOString(),
        apiEndpoint: `https://api.example.com/process/${recordType}`,
        retryPolicy: { maxRetries: 3, backoffMs: 1000 }
      }

      // Store the context for this operation to be accessed later in pollMultiple
      data.stateContext?.setResponseContext?.(operationId, contextData, {})

      return {
        operationId,
        status: 'pending' as const,
        payloadIndices: indices
      }
    })

    // Simulate API call to initiate processing
    await request.post('https://api.example.com/async/batch', {
      json: {
        operations: operations.map((op) => ({
          operationId: op.operationId,
          recordType: data.data[op.payloadIndices[0]].recordType,
          records: op.payloadIndices.map((i) => data.data[i])
        }))
      }
    })

    return {
      operations,
      batchStatus: 'pending',
      message: `Initiated ${operations.length} async operations for different record types`
    } as MultiAsyncOperationResponse
  },

  async pollMultiple(request: any, data: MultiPollInput<unknown, unknown>) {
    // Use context data from stateContext to make smarter polling decisions
    const pollRequests = data.operationIds.map((operationId) => {
      // Get context data that was stored in performBatch using stateContext
      const context = data.stateContext?.getRequestContext?.(operationId)
      const apiEndpoint = context?.apiEndpoint || 'https://api.example.com/async/poll'

      return {
        operationId,
        context,
        pollUrl: `${apiEndpoint}/${operationId}`
      }
    })

    // Poll status of all operations using context-specific endpoints
    const responses = await Promise.all(
      pollRequests.map(({ operationId, context, pollUrl }) =>
        request
          .get(pollUrl, {
            headers: {
              'X-Record-Type': context?.recordType,
              'X-Batch-Size': context?.batchSize?.toString()
            }
          })
          .then((response: any) => ({
            operationId,
            context,
            response: response.data
          }))
      )
    )

    const pollData = {
      results: responses.map(({ operationId, context, response }) => ({
        operationId,
        status: response.status || 'pending',
        processedRecords: response.processedRecords,
        error: response.error,
        context // Include context in response for potential retry logic
      }))
    }

    // Determine overall status
    const allCompleted = pollData.results.every((r) => r.status === 'completed')
    const anyFailed = pollData.results.some((r) => r.status === 'failed')
    const overallStatus = anyFailed ? 'failed' : allCompleted ? 'completed' : 'pending'

    // Build results and payload results, using context for enhanced result processing
    const results = pollData.results.map((r) => ({
      operationId: r.operationId,
      status: r.status,
      result: r.processedRecords || {
        error: r.error,
        recordType: r.context?.recordType,
        batchSize: r.context?.batchSize
      }
    }))

    // Flatten all processed records in order
    const payloadResults = pollData.results.flatMap((r) => r.processedRecords || [])

    return {
      overallStatus,
      results,
      payloadResults
    } as MultiPollResponse
  }
} as any)

// Usage example
async function exampleUsage() {
  // 1. Execute batch with mixed record types
  const batchResult = await multiAsyncAction.executeBatch({
    data: [
      { recordType: 'user', data: { name: 'John', email: 'john@example.com' } },
      { recordType: 'event', data: { event: 'page_view', url: '/home' } },
      { recordType: 'user', data: { name: 'Jane', email: 'jane@example.com' } },
      { recordType: 'group', data: { name: 'Admins', memberCount: 5 } },
      { recordType: 'event', data: { event: 'click', element: 'button' } }
    ],
    settings: { apiKey: 'test-key' },
    mapping: {},
    auth: undefined,
    features: {},
    statsContext: { statsClient: undefined as any, tags: [] },
    logger: console as any
  })

  // 2. Extract operation IDs from successful results
  const operationIds: string[] = []
  batchResult.forEach((result: any) => {
    if (result.status === 202 && result.body) {
      const body = result.body
      if (body.operations) {
        body.operations.forEach((op: { operationId: string }) => operationIds.push(op.operationId))
      }
    }
  })

  // 3. Poll for completion
  let pollCount = 0
  const maxPolls = 10
  let finalResult: MultiPollResponse | null = null

  while (pollCount < maxPolls) {
    const pollResult = await multiAsyncAction.executePollMultiple({
      operationIds,
      settings: { apiKey: 'test-key' },
      auth: undefined,
      features: {},
      statsContext: { statsClient: undefined as any, tags: [] },
      logger: console as any
    })

    if (pollResult.overallStatus === 'completed' || pollResult.overallStatus === 'failed') {
      finalResult = pollResult
      break
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, 1000))
    pollCount++
  }

  return finalResult
}

export { multiAsyncAction, exampleUsage }
