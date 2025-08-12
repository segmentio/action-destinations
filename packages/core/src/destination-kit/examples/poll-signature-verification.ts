/**
 * Simple verification script to test the new poll method signatures
 */

import { ActionDefinition } from '../action'
import type { RequestClient } from '../../create-request-client'

interface TestSettings {
  apiKey: string
}

interface TestPayload {
  id: string
  name: string
}

// This should compile without errors with the new signature
const testAction: ActionDefinition<TestSettings, TestPayload> = {
  title: 'Test Action',
  description: 'Test action for poll signature verification',
  fields: {
    id: {
      label: 'ID',
      description: 'Unique identifier',
      type: 'string',
      required: true
    },
    name: {
      label: 'Name',
      description: 'Name field',
      type: 'string',
      required: true
    }
  },

  async perform(_request: RequestClient, { settings: _settings, payload }) {
    // Simple perform implementation
    return { success: true, id: payload.id }
  },

  async performBatch(_request: RequestClient, { settings: _settings, payload, stateContext }) {
    // Store context for polling
    stateContext?.setResponseContext(
      'batchInfo',
      JSON.stringify({
        batchSize: payload.length,
        submittedAt: new Date().toISOString()
      }),
      {}
    )

    return {
      operationId: 'test-op-123',
      status: 'pending' as const,
      message: `Processing ${payload.length} items`
    }
  },

  // New poll signature following Braze cohorts pattern
  async poll(_request: RequestClient, { settings: _settings, payload, stateContext }) {
    // In real implementation, this would check actual operation status
    // Here we just simulate a successful completion
    const operationId = stateContext?.getRequestContext('operationId')

    // Return completion result
    return {
      status: 'completed',
      result: {
        operationId: operationId || payload.operationId,
        processedAt: new Date().toISOString(),
        records: 1
      }
    }
  },

  async pollMultiple(_request: RequestClient, { settings: _settings, payload, stateContext: _stateContext }) {
    // In real implementation, this would check actual operation status for each operation
    // Here we just simulate successful completion for all operations

    return payload.operationIds.map((operationId: string) => ({
      operationId,
      status: 'completed' as const,
      result: {
        operationId,
        processedAt: new Date().toISOString(),
        records: 1
      }
    }))
  }
}

export default testAction
