import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { identifyUserRequestParams } from '../request-params'
import { IntegrationError } from '@segment/actions-core'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: 'Sets user identity variables',
  platform: 'cloud',
  fields: {
    userId: {
      type: 'string',
      description: "The user's id",
      label: 'User ID',
      default: {
        '@path': '$.userId'
      }
    },
    email: {
      type: 'string',
      description: "The user's email",
      label: 'Email',
      default: {
        '@path': '$.traits.email'
      }
    },
    createdAt: {
      type: 'string',
      description: "The user's creation date",
      label: 'Created At',
      default: {
        '@path': '$.traits.createdAt'
      }
    },
    anonymousId: {
      type: 'string',
      description: "The user's anonymous id",
      label: 'Anonymous ID',
      default: {
        '@path': '$.anonymousId'
      }
    },
    traits: {
      type: 'object',
      description: 'The Segment traits to be forwarded to Usermaven',
      label: 'Traits',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      properties: {
        firstName: {
          label: 'First Name',
          type: 'string'
        },
        lastName: {
          label: 'Last Name',
          type: 'string'
        },
        company: {
          label: 'Company',
          type: 'object'
        },
        custom: {
          label: 'Custom',
          type: 'object'
        }
      },
      default: {
        firstName: { '@path': '$.traits.first_name' },
        lastName: { '@path': '$.traits.last_name' },
        company: { '@path': '$.traits.company' },
        custom: { '@path': '$.traits.custom' }
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const { userId, anonymousId, email, createdAt, traits } = payload

    // Validate User ID (Required and must be a string)
    if (!userId || typeof userId !== 'string') {
      throw new IntegrationError('User ID is required and must be a string', 'Invalid User ID', 400)
    }

    // Validate Email (Required and must be a string)
    if (!email || typeof email !== 'string') {
      throw new IntegrationError('Email is required and must be a string', 'Invalid Email', 400)
    }

    // Validate Created At (Required and must be a string)
    if (!createdAt || typeof createdAt !== 'string') {
      throw new IntegrationError('Created At is required and must be a string', 'Invalid Created At', 400)
    }

    // Validate Traits
    if (traits?.company) {
      if (typeof traits.company !== 'object') {
        throw new IntegrationError('Company must be an object', 'Invalid Traits', 400)
      }

      // Validate Company ID (Required and must be a string)
      if (!traits.company.id || typeof traits.company.id !== 'string') {
        throw new IntegrationError('Company ID is required and must be a string', 'Invalid Traits', 400)
      }

      // Validate Company Name (Required and must be a string)
      if (!traits.company.name || typeof traits.company.name !== 'string') {
        throw new IntegrationError('Company Name is required and must be a string', 'Invalid Traits', 400)
      }

      // Validate Company Created At (Required and must be a string)
      if (!traits.company.createdAt || typeof traits.company.createdAt !== 'string') {
        throw new IntegrationError('Company Created At is required and must be a string', 'Invalid Traits', 400)
      }
    }

    const { url, options } = identifyUserRequestParams(
      settings,
      {
        userId,
        anonymousId,
        email,
        createdAt
      },
      {
        firstName: traits?.firstName,
        lastName: traits?.lastName,
        company: traits?.company,
        custom: traits?.custom
      }
    )

    return request(url, options)
  }
}

export default action
