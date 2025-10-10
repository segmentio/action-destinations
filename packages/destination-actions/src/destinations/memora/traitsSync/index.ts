import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, RetryableError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Traits Sync',
  description:
    'Merge traits into an existing Memora profile using PATCH API. Only the traits provided are added or updated; unspecified traits remain unchanged.',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {
    profileId: {
      label: 'Profile ID',
      description:
        'Unique identifier for the profile using Twilio Type ID (TTID) format. If not provided, will attempt to use userId or anonymousId.',
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    contact: {
      label: 'Contact Information',
      description:
        'Contact information object containing email, firstName, lastName, and phone fields that will be placed in traits.Contact in the Memora API call.',
      type: 'object',
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
        phone: { '@path': '$.properties.phone' }
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    console.log('perform called')
    const serviceId = settings.serviceId
    if (!serviceId) {
      throw new IntegrationError('Service ID is required', 'MISSING_REQUIRED_FIELD', 400)
    }

    if (!payload.profileId) {
      throw new IntegrationError('Profile ID is required for traits sync', 'MISSING_REQUIRED_FIELD', 400)
    }

    // Build traits payload from contact information
    const traitsPayload = buildMemoraTraitsPayload(payload)

    // Validate that we have contact information to sync
    if (!traitsPayload.traits.Contact || Object.keys(traitsPayload.traits.Contact).length === 0) {
      throw new IntegrationError('Contact information must be provided', 'EMPTY_CONTACT', 400)
    }
    try {
      const response = await request(`http://localhost:80/v1/Services/${serviceId}/Profiles/${payload.profileId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.api_key}`,
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        json: traitsPayload
      })

      // API returns 202 for successful trait patch acceptance
      if (response.status !== 201) {
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
  }
}

// Helper function to build Memora traits payload from contact information
function buildMemoraTraitsPayload(payload: Payload) {
  const traitsPayload: { traits: { Contact: Record<string, unknown> } } = {
    traits: {
      Contact: {}
    }
  }

  // Build Contact trait group from contact field
  if (payload.contact && typeof payload.contact === 'object') {
    const contactData = payload.contact as Record<string, unknown>
    const contact: Record<string, unknown> = {}

    // Only include non-null, non-undefined values
    if (contactData.email) contact.email = contactData.email
    if (contactData.firstName) contact.firstName = contactData.firstName
    if (contactData.lastName) contact.lastName = contactData.lastName
    if (contactData.phone) contact.phone = contactData.phone

    traitsPayload.traits.Contact = contact
  }

  return traitsPayload
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
        throw new IntegrationError(data?.message || 'Bad Request - Invalid trait data', 'INVALID_REQUEST_DATA', 400)
      case 404:
        throw new IntegrationError(data?.message || 'Profile not found', 'PROFILE_NOT_FOUND', 404)
      case 429: {
        // Rate limit - should be retried
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

export default action
