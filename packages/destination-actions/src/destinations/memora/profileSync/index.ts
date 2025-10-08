import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { IntegrationError, RetryableError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Profile Sync',
  description:
    'Create a new profile and optionally set initial traits. Synchronously resolves identity and either creates a new profile ID or retrieves the associated canonical profile ID.',
  defaultSubscription: 'type = "identify"',
  fields: {
    contact: {
      label: 'Contact Information',
      description:
        'Contact information object containing email, firstName, lastName, and phone fields that will be placed in traits.contact in the Memora API call.',
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
        firstName: { '@path': '$.traits.first_name' },
        lastName: { '@path': '$.traits.last_name' },
        phone: {
          '@path': '$.traits.phone'
        }
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    // Single profile sync - use synchronous profile creation API
    const serviceId = settings.serviceId
    if (!serviceId) {
      throw new IntegrationError('Service ID is required', 'MISSING_REQUIRED_FIELD', 400)
    }

    // Build traits payload from contact information
    const traitsPayload = buildMemoraProfilePayload(payload)
    return console.log('payload', traitsPayload)
    // Validate that the profile has meaningful data
    if (!traitsPayload.traits || Object.keys(traitsPayload.traits).length === 0) {
      throw new IntegrationError('Profile must contain at least one trait', 'EMPTY_PROFILE', 400)
    }

    try {
      const response = await request(`https://api.memora.com/Services/${serviceId}/Profiles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${settings.authToken}`,
          ...(settings.twilioAccount && { 'X-Pre-Auth-Context': settings.twilioAccount })
        },
        json: traitsPayload
      })

      // API returns 202 for successful profile resolution and processing
      if (response.status !== 202) {
        throw new IntegrationError(`Unexpected response status: ${response.status}`, 'API_ERROR', response.status)
      }

      return response
    } catch (error) {
      // Only handle actual HTTP errors, not our custom status check errors
      if (error instanceof IntegrationError) {
        throw error
      }
      handleMemoryApiError(error)
    }
  }
}

// Helper function to build the Memora profile payload for POST API
function buildMemoraProfilePayload(payload: Payload) {
  const traits: Record<string, Record<string, unknown>> = {}

  // Handle contact information from the explicit contact field mapping
  if (payload.contact && typeof payload.contact === 'object') {
    // Clean contact object by removing any undefined/null values
    const contact: Record<string, unknown> = {}
    const contactData = payload.contact as Record<string, unknown>

    if (contactData.email) contact.email = contactData.email
    if (contactData.firstName) contact.firstName = contactData.firstName
    if (contactData.lastName) contact.lastName = contactData.lastName
    if (contactData.phone) contact.phone = contactData.phone

    // Only add contact if it has at least one field
    if (Object.keys(contact).length > 0) {
      traits.Contact = contact
    }
  }

  return { traits }
}

// Helper function to handle Memora API errors
function handleMemoryApiError(error: unknown): never {
  const httpError = error as {
    response?: { status: number; data?: { message?: string }; headers?: Record<string, string> }
    message?: string
  }

  if (httpError.response) {
    const status = httpError.response.status
    const data = httpError.response.data

    switch (status) {
      case 400:
        throw new IntegrationError(data?.message || 'Bad Request - Invalid request data', 'INVALID_REQUEST_DATA', 400)
      case 404:
        throw new IntegrationError(data?.message || 'Profile service not found', 'SERVICE_NOT_FOUND', 404)
      case 429: {
        // Rate limit - should be retried
        throw new RetryableError(data?.message || 'Rate limit exceeded')
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
