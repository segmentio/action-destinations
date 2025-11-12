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
    contact: {
      label: 'Contact Information',
      description:
        'Contact information object containing email, firstName, lastName, and phone fields that will be placed in the Contact trait group in the Memora API call.',
      type: 'object',
      dynamic: true,
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      default: {
        email: { '@path': '$.properties.email' },
        firstName: { '@path': '$.traits.first_name' },
        lastName: { '@path': '$.traits.last_name' },
        phone: { '@path': '$.traits.phone' }
      }
    },
    traitGroups: {
      label: 'Trait Groups',
      description:
        'Additional trait groups to merge into the Memora profile. Keys should match trait group names and values should be objects of traits for that group.',
      type: 'object',
      required: false,
      dynamic: true,
      additionalProperties: true,
      defaultObjectUI: 'keyvalue'
    }
  },
  dynamicFields: {
    contact: {
      __keys__: async (request, { settings }) => {
        return fetchTraitFields(request, settings, 'Contact')
      }
    },
    traitGroups: {
      __keys__: async (request, { settings }) => {
        return fetchTraitGroups(request, settings)
      },
      __values__: async (request, { settings, dynamicFieldContext }) => {
        const traitGroup = dynamicFieldContext?.selectedKey
        if (!traitGroup) {
          return { choices: [] }
        }
        return fetchTraitFields(request, settings, traitGroup)
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

  if (payload.traitGroups && typeof payload.traitGroups === 'object' && !Array.isArray(payload.traitGroups)) {
    for (const [groupName, groupValue] of Object.entries(payload.traitGroups)) {
      if (!groupValue || typeof groupValue !== 'object' || Array.isArray(groupValue)) {
        continue
      }

      const cleanedGroup = cleanObject(groupValue)
      if (Object.keys(cleanedGroup).length > 0) {
        traitGroups[groupName] = cleanedGroup
      }
    }
  }

  if (payload.contact && typeof payload.contact === 'object') {
    const contact = cleanObject(payload.contact)
    if (Object.keys(contact).length > 0) {
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

interface TraitGroup {
  name?: string
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

// Fetch available trait groups
async function fetchTraitGroups(
  request: ReturnType<typeof import('@segment/actions-core').createRequestClient>,
  settings: Settings
) {
  try {
    const baseUrl = normalizeBaseUrl(settings.url)

    // Fetch available trait groups from the service
    const response = await request<{ traitGroups?: TraitGroup[]; meta?: { nextPageToken?: string } }>(
      `${baseUrl}/${API_VERSION}/Services/${settings.serviceId}/trait-groups`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${settings.api_key}`,
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        skipResponseCloning: true
      }
    )

    const traitGroups = response?.data?.traitGroups || []
    const choices = traitGroups.map((group: TraitGroup) => ({
      label: group.name || '',
      value: group.name || ''
    }))

    return {
      choices,
      nextPage: response?.data?.meta?.nextPageToken
    }
  } catch (error) {
    // Return default trait groups if the API call fails
    return {
      choices: [
        { label: 'Contact', value: 'Contact' },
        { label: 'Custom', value: 'Custom' }
      ],
      error: {
        message: 'Unable to fetch trait groups. Showing default options.',
        code: 'FETCH_ERROR'
      }
    }
  }
}

export default action

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '')
}
