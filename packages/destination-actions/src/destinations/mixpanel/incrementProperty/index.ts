import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { MixpanelEngageProperties, MixpanelIncrementPropertyObject } from '../mixpanel-types'
import { getApiServerUrl } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Increment Property',
  description:
    'Increment the value of a user profile property. Learn more about [Incrementing Numerical Properties](https://developer.mixpanel.com/reference/profile-numerical-add).',
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
    $add: {
      label: 'Increment Numerical Properties',
      type: 'object',
      description: 'Profile properties to increment',
      required: true,
      multiple: false,
      defaultObjectUI: 'keyvalue',
      default: {
        '@path': '$.properties.$add'
      }
    }
  },
  perform: async (request, { payload, settings }) => {
    const $add: MixpanelIncrementPropertyObject = {}

    for (const key of Object.keys(payload.$add)) {
      const value = payload.$add[key]
      if (typeof value === 'string' || (typeof value === 'number' && !isNaN(+value))) {
        $add[key] = +value
      }
    }

    const data: MixpanelEngageProperties = {
      $token: settings.projectToken,
      $distinct_id: payload.user_id ?? payload.anonymous_id,
      $ip: payload.ip,
      $add: $add
    }

    const apiServerUrl = getApiServerUrl(settings.apiRegion)
    return request(`${apiServerUrl}/engage`, {
      method: 'post',
      body: new URLSearchParams({ data: JSON.stringify(data) })
    })
  }
}

export default action
