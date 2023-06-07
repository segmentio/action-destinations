import type { ActionDefinition } from '@segment/actions-core'
import { BASE_API_URL } from '../constants/api'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

import cloneWithDefinedProps from '../utils/cloneWithDefinedProps'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description: 'Identify a user on Canny',
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
      default: {
        '@path': '$.traits'
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
  perform: async (request, { settings, payload }) => {
    const { type, userId } = payload
    const traits = payload.traits ? { ...payload.traits } : {}
    const customFieldTraits = settings.customFields ? settings.customFields.split(',') : []

    if (customFieldTraits.length) {
      const customFields = cloneWithDefinedProps(traits, customFieldTraits)
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
