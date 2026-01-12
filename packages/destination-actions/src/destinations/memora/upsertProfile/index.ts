import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, RetryableError } from '@segment/actions-core'
import { API_VERSION, BASE_URL } from '../index'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Upsert Profile',
  description:
    'Create or update Memora profiles using the bulk upsert API. If a profile already exists, its traits are merged (new keys added, existing keys overwritten). Supports batching up to 1000 profiles.',
  defaultSubscription: 'type = "identify"',
  fields: {
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enable batching of requests to Memora. Batches can contain up to 1000 profiles.',
      type: 'boolean',
      default: true,
      unsafe_hidden: true
    },
    batch_size: {
      label: 'Batch Size',
      description: 'Maximum number of profiles to include in each batch. Actual batch sizes may be lower.',
      type: 'number',
      default: 1000,
      unsafe_hidden: true
    },
    memora_store: {
      label: 'Memora Store',
      description:
        'The Memora Store ID to use for this profile. This should be a valid Memora Store associated with your Twilio account.',
      type: 'string',
      required: true,
      dynamic: true
    },
    contact: {
      label: 'Contact Information',
      description:
        'Contact information object containing email, firstName, lastName, and phone fields that will be placed in the Contact trait group in the Memora API call.',
      type: 'object',
      required: false,
      additionalProperties: true,
      properties: {
        email: {
          label: 'Email',
          description: 'User email address',
          type: 'string',
          format: 'email'
        },
        firstName: {
          label: 'First Name',
          description: 'User first name',
          type: 'string'
        },
        lastName: {
          label: 'Last Name',
          description: 'User last name',
          type: 'string'
        },
        phone: {
          label: 'Phone',
          description: 'User phone number',
          type: 'string'
        }
      },
      default: {
        email: { '@path': '$.properties.email' },
        firstName: { '@path': '$.properties.first_name' },
        lastName: { '@path': '$.properties.last_name' },
        phone: {
          '@path': '$.properties.phone'
        }
      }
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoraStores(request, settings)
    }
  },
  perform: async (request, { payload, settings }) => {
    return upsertProfiles(request, [payload], settings)
  },

  performBatch: async (request, { payload: payloads, settings }) => {
    return upsertProfiles(request, payloads, settings)
  }
}

// Process single or batch profile upserts
async function upsertProfiles(
  request: ReturnType<typeof import('@segment/actions-core').createRequestClient>,
  payloads: Payload[],
  settings: Settings
) {
  const storeId = payloads[0]?.memora_store

  if (!payloads || payloads.length === 0) {
    throw new IntegrationError('No profiles provided for batch sync', 'EMPTY_BATCH', 400)
  }

  const profiles = payloads.map((payload, index) => {
    const traitGroups = buildTraitGroups(payload)
    if (Object.keys(traitGroups).length === 0) {
      throw new IntegrationError(
        `Profile at index ${index} must contain at least one trait group or contact field`,
        'EMPTY_PROFILE',
        400
      )
    }

    return { traits: traitGroups }
  })

  try {
    const response = await request(`${BASE_URL}/${API_VERSION}/Stores/${storeId}/Profiles/Bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
      },
      json: {
        profiles
      }
    })

    if (response.status !== 202) {
      throw new IntegrationError(`Unexpected response status: ${response.status}`, 'API_ERROR', response.status)
    }

    return response
  } catch (error) {
    if (error instanceof IntegrationError) {
      throw error
    }
    handleMemoraApiError(error)
  }
}

// Build trait groups payload for Memora API
function buildTraitGroups(payload: Payload) {
  const traitGroups: Record<string, Record<string, unknown>> = {}

  // Process contact field
  if (payload.contact && typeof payload.contact === 'object') {
    const contact = payload.contact as Record<string, unknown>
    if (Object.keys(contact).length > 0) {
      traitGroups.Contact = contact
    }
  }

  return traitGroups
}

// Helper function to handle Memora API errors
function handleMemoraApiError(error: unknown): never {
  const httpError = error as {
    response?: { status: number; data?: { message?: string; code?: number }; headers?: Record<string, string> }
    message?: string
  }

  if (httpError.response) {
    const status = httpError.response.status
    const data = httpError.response.data

    switch (status) {
      case 400:
        throw new IntegrationError(data?.message || 'Bad Request - Invalid request data', 'INVALID_REQUEST_DATA', 400)
      case 404:
        throw new IntegrationError(data?.message || 'Profile or service not found', 'SERVICE_NOT_FOUND', 404)
      case 429: {
        const retryAfter = httpError.response.headers?.['retry-after']
        const message = retryAfter ? `Rate limit exceeded. Retry after ${retryAfter} seconds` : 'Rate limit exceeded'
        throw new RetryableError(data?.message || message)
      }
      case 500:
        throw new RetryableError(data?.message || 'Internal server error')
      case 503:
        throw new RetryableError(data?.message || 'Service unavailable')
      default:
        throw new IntegrationError(data?.message || `HTTP ${status} error`, 'API_ERROR', status)
    }
  }

  // Network or other errors
  throw new RetryableError(httpError.message || 'Network error occurred')
}

interface MemoraStoresResponse {
  services?: string[]
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

// Fetch available memora stores from Control Plane
async function fetchMemoraStores(
  request: ReturnType<typeof import('@segment/actions-core').createRequestClient>,
  settings: Settings
) {
  try {
    // Call the Control Plane API to list memora stores
    const response = await request<MemoraStoresResponse>(
      `${BASE_URL}/${API_VERSION}/ControlPlane/Stores?pageSize=100&orderBy=ASC`,
      {
        method: 'GET',
        headers: {
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        skipResponseCloning: true
      }
    )
    const services = response?.data?.services || []
    const choices = services.map((serviceId: string) => ({
      label: serviceId,
      value: serviceId
    }))

    return {
      choices
    }
  } catch (error) {
    // Return empty choices if the API call fails
    return {
      choices: [],
      error: {
        message: 'Unable to fetch memora stores. You can still manually enter a memora store ID.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

export default action
