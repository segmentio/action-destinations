import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, RetryableError, createRequestClient } from '@segment/actions-core'
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
    contact_identifiers: {
      label: 'Contact Identifiers',
      description: 'Contact identifiers (email and/or phone). At least one identifier is required.',
      type: 'object',
      required: true,
      additionalProperties: false,
      properties: {
        email: {
          label: 'Email',
          description: 'User email address',
          type: 'string',
          format: 'email'
        },
        phone: {
          label: 'Phone',
          description: 'User phone number',
          type: 'string'
        }
      },
      default: {
        email: { '@path': '$.properties.email' },
        phone: { '@path': '$.properties.phone' }
      }
    },
    contact_traits: {
      label: 'Other Contact Traits',
      description:
        'Additional contact traits for the profile. These fields are dynamically loaded from the selected Memora Store.',
      type: 'object',
      required: false,
      additionalProperties: true,
      dynamic: true
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoraStores(request, settings)
    },
    contact_traits: {
      __keys__: async (request, { settings, payload }) => {
        if (!payload.memora_store) {
          return { choices: [], error: { message: 'Please select a Memora Store first', code: 'STORE_REQUIRED' } }
        }
        return fetchContactTraits(request, settings, payload.memora_store)
      }
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
  request: ReturnType<typeof createRequestClient>,
  payloads: Payload[],
  settings: Settings
) {
  const storeId = payloads[0]?.memora_store

  if (!payloads || payloads.length === 0) {
    throw new IntegrationError('No profiles provided for batch sync', 'EMPTY_BATCH', 400)
  }

  const profiles = payloads.map((payload, index) => {
    // Validate that at least one identifier is present
    const identifiers = payload.contact_identifiers || {}
    if (!identifiers.email && !identifiers.phone) {
      throw new IntegrationError(
        `Profile at index ${index} must contain at least one identifier (email or phone)`,
        'MISSING_IDENTIFIER',
        400
      )
    }

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
  const contact: Record<string, unknown> = {}

  // Add contact identifiers
  if (payload.contact_identifiers) {
    const identifiers = payload.contact_identifiers as Record<string, unknown>
    if (identifiers.email) {
      contact.email = identifiers.email
    }
    if (identifiers.phone) {
      contact.phone = identifiers.phone
    }
  }

  // Add other contact traits
  if (payload.contact_traits && typeof payload.contact_traits === 'object') {
    const traits = payload.contact_traits as Record<string, unknown>
    Object.keys(traits).forEach((key) => {
      if (traits[key] !== undefined) {
        contact[key] = traits[key]
      }
    })
  }

  if (Object.keys(contact).length > 0) {
    traitGroups.Contact = contact
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
  stores?: string[]
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

interface TraitDefinition {
  name: string
  dataType: string
  description?: string
}

interface TraitGroupResponse {
  traitGroupName?: string
  traits?: TraitDefinition[]
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

// Fetch contact trait definitions for dynamic fields
async function fetchContactTraits(
  request: ReturnType<typeof createRequestClient>,
  settings: Settings,
  storeId: string
) {
  try {
    const response = await request<TraitGroupResponse>(
      `${BASE_URL}/${API_VERSION}/ControlPlane/Stores/${storeId}/TraitGroups/Contact?includeTraits=true&pageSize=100`,
      {
        method: 'GET',
        headers: {
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        skipResponseCloning: true
      }
    )

    const traits = response?.data?.traits || []
    const choices = traits
      .filter((trait) => trait.name !== 'email' && trait.name !== 'phone') // Exclude static identifiers
      .map((trait) => ({
        label: trait.name,
        value: trait.name,
        description: trait.description || `${trait.name} (${trait.dataType})`
      }))

    return {
      choices,
      nextPage: response?.data?.meta?.nextToken
    }
  } catch (error) {
    return {
      choices: [],
      error: {
        message: 'Unable to fetch contact traits. You can still manually enter field names.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

// Fetch available memora stores from Control Plane
async function fetchMemoraStores(request: ReturnType<typeof createRequestClient>, settings: Settings) {
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
    const stores = response?.data?.stores || []
    const choices = stores.map((storeId: string) => ({
      label: storeId,
      value: storeId
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
