/**
 * Test example demonstrating context passing from performBatch to poll methods
 * using stateContext pattern inspired by Braze cohorts destination
 */

import { ActionDefinition, ExecuteInput } from '../'
import type { RequestClient } from '../../create-request-client'

interface Settings {
  apiKey: string
  region: string
}

interface Payload {
  userId: string
  attributes: Record<string, unknown>
}

const testAction: ActionDefinition<Settings, Payload> = {
  title: 'Context Passing Test Action',
  description: 'Test action to verify context passing between performBatch and poll methods',
  fields: {
    userId: {
      label: 'User ID',
      description: 'Unique identifier for the user',
      type: 'string',
      required: true
    },
    attributes: {
      label: 'User Attributes',
      description: 'Additional attributes for the user',
      type: 'object',
      required: false
    }
  },

  async perform(request: RequestClient, data: ExecuteInput<Settings, Payload>) {
    // Single record operation (not async)
    const { payload, settings } = data

    const response = await request('https://api.example.com/single', {
      method: 'POST',
      json: {
        apiKey: settings.apiKey,
        region: settings.region,
        user: payload
      }
    })

    return await response.json()
  },

  async performBatch(request: RequestClient, data: ExecuteInput<Settings, Payload[]>) {
    const { payload, settings, stateContext } = data

    // Simulate making an API call that returns an operation ID
    const response = await request('https://api.example.com/batch', {
      method: 'POST',
      json: {
        apiKey: settings.apiKey,
        region: settings.region,
        users: payload
      }
    })

    const responseData = await response.json()

    // Store additional context that poll method will need
    // This follows the pattern from Braze cohorts destination
    stateContext?.setResponseContext(
      'batchMetadata',
      JSON.stringify({
        submittedAt: new Date().toISOString(),
        totalRecords: payload.length,
        region: settings.region,
        requestId: responseData.requestId
      }),
      {}
    )

    stateContext?.setResponseContext(
      'apiCredentials',
      JSON.stringify({
        apiKey: settings.apiKey,
        endpoint: 'https://api.example.com'
      }),
      {}
    )

    return {
      operationId: responseData.operationId,
      status: 'pending' as const,
      message: `Batch operation initiated for ${payload.length} records`
    }
  },

  async poll(request: RequestClient, { payload, settings, stateContext }) {
    const { operationId } = payload

    // Retrieve context set by performBatch method
    const batchMetadataStr = stateContext?.getRequestContext('batchMetadata')
    const apiCredentialsStr = stateContext?.getRequestContext('apiCredentials')

    const batchMetadata = batchMetadataStr && typeof batchMetadataStr === 'string' ? JSON.parse(batchMetadataStr) : null
    const apiCredentials =
      apiCredentialsStr && typeof apiCredentialsStr === 'string' ? JSON.parse(apiCredentialsStr) : null

    // Use the context data in the poll request
    const response = await request(`${apiCredentials?.endpoint || 'https://api.example.com'}/status/${operationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiCredentials?.apiKey || settings.apiKey}`,
        'X-Request-ID': batchMetadata?.requestId || 'unknown'
      }
    })

    const statusData = await response.json()

    return {
      status: (statusData.completed ? 'completed' : 'pending') as 'pending' | 'completed' | 'failed',
      message: batchMetadata
        ? `Operation for ${batchMetadata.totalRecords} records (submitted at ${batchMetadata.submittedAt}): ${statusData.message}`
        : statusData.message
    }
  },

  async pollMultiple(request: RequestClient, { payload, settings, stateContext }) {
    const { operationIds } = payload

    // Retrieve context set by performBatch method
    const batchMetadataStr = stateContext?.getRequestContext('batchMetadata')
    const apiCredentialsStr = stateContext?.getRequestContext('apiCredentials')

    const batchMetadata = batchMetadataStr && typeof batchMetadataStr === 'string' ? JSON.parse(batchMetadataStr) : null
    const apiCredentials =
      apiCredentialsStr && typeof apiCredentialsStr === 'string' ? JSON.parse(apiCredentialsStr) : null

    // Poll multiple operations using context data
    const pollPromises = operationIds.map(async (operationId) => {
      const response = await request(`${apiCredentials?.endpoint || 'https://api.example.com'}/status/${operationId}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiCredentials?.apiKey || settings.apiKey}`,
          'X-Request-ID': batchMetadata?.requestId || 'unknown'
        }
      })

      const statusData = await response.json()

      return {
        status: (statusData.completed ? 'completed' : 'pending') as 'pending' | 'completed' | 'failed',
        message: batchMetadata
          ? `Operation ${operationId} for batch submitted at ${batchMetadata.submittedAt}: ${statusData.message}`
          : statusData.message
      }
    })

    return Promise.all(pollPromises)
  }
}

export default testAction
