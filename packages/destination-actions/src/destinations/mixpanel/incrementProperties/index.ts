import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { MixpanelEngageProperties } from '../mixpanel-types'
import { getApiServerUrl } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Increment Properties',
  description:
    'Increment the value of a user profile property. [Learn More](https://developer.mixpanel.com/reference/profile-numerical-add).',
  defaultSubscription: 'type = "track"',
  fields: {
    ip: {
      label: 'IP Address',
      type: 'string',
      description: "The IP address of the user. This is only used for geolocation and won't be stored.",
      default: {
        '@path': '$.context.ip'
      }
    },
    user_id: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'The unique user identifier set by you',
      default: {
        '@path': '$.userId'
      }
    },
    anonymous_id: {
      label: 'Anonymous ID',
      type: 'string',
      allowNull: true,
      description: 'The generated anonymous ID for the user',
      default: {
        '@path': '$.anonymousId'
      }
    },
    increment: {
      label: 'Increment Numerical Properties',
      type: 'object',
      description: 'Object of properties and the values to increment or decrement',
      multiple: false,
      defaultObjectUI: 'keyvalue',
      default: {
        '@path': '$.properties.increment'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    if (!settings.projectToken) {
      throw new IntegrationError('Missing project token', 'Missing required field', 400)
    }

    const apiServerUrl = getApiServerUrl(settings.apiRegion)

    const responses = []

    if (payload.increment && Object.keys(payload.increment).length > 0) {
      const data: MixpanelEngageProperties = {
        $token: settings.projectToken,
        $distinct_id: payload.user_id ?? payload.anonymous_id,
        $ip: payload.ip
      }
      data.$add = {}

      for (const key of Object.keys(payload.increment)) {
        const value = payload.increment[key]
        if (typeof value === 'string' || typeof value === 'number') {
          if (!isNaN(+value)) {
            data.$add[key] = +value
          }
        }
      }

      const response = request(`${apiServerUrl}/engage`, {
        method: 'post',
        body: new URLSearchParams({ data: JSON.stringify(data) })
      })

      responses.push(response)
    }

    return Promise.all(responses)
  }
}

export default action
