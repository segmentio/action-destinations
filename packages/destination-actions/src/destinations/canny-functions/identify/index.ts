import type { ActionDefinition } from '@segment/actions-core'
import { BASE_API_URL } from '../constants/api'
import { DefaultFields } from '../constants/traits'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Create or update a user profile in Canny.',
  fields: {
    userId: {
      label: 'User ID',
      type: 'string',
      required: true,
      description: 'A distinct ID of an identified (logged in) user.',
      default: {
        '@path': '$.userId'
      }
    },
    traits: {
      label: 'User Properties',
      type: 'object',
      description: 'Properties to set on the user profile',
      additionalProperties: true,
      defaultObjectUI: 'keyvalue',
      properties: {
        avatar: {
          label: 'Avatar',
          description: 'URL to an avatar image for the user',
          type: 'string'
        },
        company: {
          label: 'Company',
          description: 'Company the user represents. Should contain: name (String), id (String or Number)',
          type: 'object'
        },
        createdAt: {
          label: 'Create At Date',
          description: "Date the user's account was first created. Segment recommends using ISO-8601 date strings",
          type: 'string'
        },
        id: {
          label: 'User ID',
          description: 'A distinct identifier of the user in your application.',
          type: 'string'
        },
        name: {
          label: 'Name',
          description: "The user's name",
          type: 'string'
        },
        email: {
          label: 'Email',
          description: "The user's email",
          type: 'string'
        }
      },
      default: {
        avatar: { '@path': '$.traits.avatar' },
        company: { '@path': '$.traits.company' },
        createdAt: { '@path': '$.traits.createdAt' },
        id: { '@path': '$.traits.id' },
        name: { '@path': '$.traits.name' },
        email: { '@path': '$.traits.email' }
      }
    },
    type: {
      label: 'Type',
      type: 'string',
      required: true,
      description: 'The type of the event',
      default: {
        '@path': '$.type'
      }
    }
  },
  perform: async (request, { payload }) => {
    const { type, userId } = payload
    const traits: Record<string, unknown> = payload.traits ? { ...payload.traits } : {}
    const customFields: Record<string, unknown> = {}

    Object.entries(traits).forEach(([key, value]) => {
      if (!DefaultFields.includes(key)) {
        customFields[key] = value
      }
    })

    if (Object.keys(customFields).length) {
      traits.customFields = customFields
    }

    const body = JSON.stringify({ traits, type, userId })
    return request(`${BASE_API_URL}/v2/identify`, {
      method: 'post',
      body
    })
  }
}

export default action
