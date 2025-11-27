import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, RetryableError } from '@segment/actions-core'

const API_VERSION = 'v1'

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
      required: false,
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
        firstName: { '@path': '$.traits.first_name' },
        lastName: { '@path': '$.traits.last_name' },
        phone: {
          '@path': '$.traits.phone'
        }
      }
    },
    otherTraits: {
      label: 'Other Traits',
      description:
        'Additional traits to include in the Memora profile. Each trait should specify the trait group, trait name, and trait value.',
      type: 'object',
      multiple: true,
      required: false,
      additionalProperties: false,
      defaultObjectUI: 'arrayeditor',
      properties: {
        traitGroup: {
          label: 'Trait Group',
          description: 'The name of the trait group (e.g., Demographics, Preferences, Custom)',
          type: 'string',
          required: true
        },
        traitName: {
          label: 'Trait Name',
          description: 'The name of the trait field',
          type: 'string',
          required: true
        },
        traitValue: {
          label: 'Trait Value',
          description: 'The value of the trait',
          type: 'string',
          required: true
        }
      },
      default: {
        '@arrayPath': [
          '$.properties',
          {
            traitGroup: {
              '@path': '$.traitGroup'
            },
            traitName: {
              '@path': '$.traitName'
            },
            traitValue: {
              '@path': '$.traitValue'
            }
          }
        ]
      }
    }
  },
  dynamicFields: {
    memora_store: async (request, { settings }) => {
      return fetchMemoryStores(request, settings)
    },
    contact: {
      __keys__: async (request, { settings }) => {
        return fetchTraitFields(request, settings, 'Contact')
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    // Single profile sync using the bulk API with a single profile payload
    const serviceId = settings.serviceId
    if (!serviceId) {
      throw new IntegrationError('Service ID is required', 'MISSING_REQUIRED_FIELD', 400)
    }

    const traitGroups = buildTraitGroups(payload)
    if (Object.keys(traitGroups).length === 0) {
      throw new IntegrationError('Profile must contain at least one trait group or contact field', 'EMPTY_PROFILE', 400)
    }

    try {
      const baseUrl = normalizeBaseUrl(settings.url)

      const response = await request(`${baseUrl}/${API_VERSION}/Services/${serviceId}/Profiles/Bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.api_key}`,
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        json: {
          profiles: [
            {
              traits: traitGroups
            }
          ]
        }
      })

      // API returns 202 when the batch is accepted for processing
      if (response.status !== 202) {
        throw new IntegrationError(`Unexpected response status: ${response.status}`, 'API_ERROR', response.status)
      }

      return response
    } catch (error) {
      // Only handle actual HTTP errors, not our custom status check errors
      if (error instanceof IntegrationError) {
        throw error
      }
      handleMemoraApiError(error)
    }
  },

  performBatch: async (request, { payload: payloads, settings }) => {
    const serviceId = settings.serviceId
    if (!serviceId) {
      throw new IntegrationError('Service ID is required', 'MISSING_REQUIRED_FIELD', 400)
    }

    if (!payloads || payloads.length === 0) {
      throw new IntegrationError('No profiles provided for batch sync', 'EMPTY_BATCH', 400)
    }

    if (payloads.length > 1000) {
      throw new IntegrationError('Batch size cannot exceed 1000 profiles', 'BATCH_SIZE_EXCEEDED', 400)
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
      const baseUrl = normalizeBaseUrl(settings.url)

      const response = await request(`${baseUrl}/${API_VERSION}/Services/${serviceId}/Profiles/Bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.api_key}`,
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
}

// Build trait groups payload for Memora API
function buildTraitGroups(payload: Payload) {
  const traitGroups: Record<string, Record<string, unknown>> = {}

  // Process otherTraits array
  if (payload.otherTraits && Array.isArray(payload.otherTraits)) {
    for (const trait of payload.otherTraits) {
      if (trait && typeof trait === 'object') {
        const { traitGroup, traitName, traitValue } = trait as {
          traitGroup?: string
          traitName?: string
          traitValue?: unknown
        }

        // Skip if essential fields are missing
        if (!traitGroup || !traitName) {
          continue
        }

        // Initialize trait group if it doesn't exist
        if (!traitGroups[traitGroup]) {
          traitGroups[traitGroup] = {}
        }

        // Only add trait if value is not null/undefined
        if (traitValue !== null && traitValue !== undefined) {
          traitGroups[traitGroup][traitName] = traitValue
        }
      }
    }
  }

  // Process contact field
  if (payload.contact && typeof payload.contact === 'object') {
    const contact = cleanObject(payload.contact)
    if (Object.keys(contact).length > 0) {
      // Merge contact into Contact trait group
      traitGroups.Contact = {
        ...(traitGroups.Contact ?? {}),
        ...contact
      }
    }
  }

  return traitGroups
}

function cleanObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object') {
    return {}
  }

  const value = input as Record<string, unknown>
  const cleaned: Record<string, unknown> = {}

  for (const [key, fieldValue] of Object.entries(value)) {
    if (fieldValue === undefined || fieldValue === null) {
      continue
    }

    if (Array.isArray(fieldValue)) {
      if (fieldValue.length > 0) {
        cleaned[key] = fieldValue
      }
      continue
    }

    if (typeof fieldValue === 'object') {
      const nested = cleanObject(fieldValue)
      if (Object.keys(nested).length > 0) {
        cleaned[key] = nested
      }
      continue
    }

    cleaned[key] = fieldValue
  }

  return cleaned
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

interface TraitField {
  name?: string
  key?: string
}

interface MemoryStoresResponse {
  services?: string[]
  meta?: {
    pageSize?: number
    nextToken?: string
    previousToken?: string
  }
}

// Fetch available memory stores from Control Plane
async function fetchMemoryStores(
  request: ReturnType<typeof import('@segment/actions-core').createRequestClient>,
  settings: Settings
) {
  try {
    const baseUrl = normalizeBaseUrl(settings.url)

    // Call the Control Plane API to list memory stores
    const response = await request<MemoryStoresResponse>(`${baseUrl}/ControlPlane/Services?pageSize=100&orderBy=ASC`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${settings.api_key}`,
        ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
      },
      skipResponseCloning: true
    })

    const services = response?.data?.services || []
    const choices = services.map((serviceId: string) => ({
      label: serviceId,
      value: serviceId
    }))

    return {
      choices,
      nextPage: response?.data?.meta?.nextToken
    }
  } catch (error) {
    // Return empty choices if the API call fails
    return {
      choices: [],
      error: {
        message: 'Unable to fetch memory stores. You can still manually enter a memory store ID.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

// Fetch available trait fields for a specific trait group
async function fetchTraitFields(
  request: ReturnType<typeof import('@segment/actions-core').createRequestClient>,
  settings: Settings,
  traitGroup: string
) {
  try {
    const baseUrl = normalizeBaseUrl(settings.url)

    // Use a sample profile to fetch trait schema - in production, you might want to query
    // a specific profile or use a metadata endpoint if available
    const response = await request<{ traits?: TraitField[]; meta?: { nextPageToken?: string } }>(
      `${baseUrl}/${API_VERSION}/Services/${settings.serviceId}/Profiles/traits-schema?traitGroups=${traitGroup}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        skipResponseCloning: true
      }
    )

    const traits = response?.data?.traits || []
    const choices = traits.map((trait: TraitField) => ({
      label: trait.name || trait.key || '',
      value: trait.key || trait.name || ''
    }))

    return {
      choices,
      nextPage: response?.data?.meta?.nextPageToken
    }
  } catch (error) {
    // Return empty choices if the API call fails
    return {
      choices: [],
      error: {
        message: 'Unable to fetch trait fields. You can still manually enter trait names.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

export default action

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}
