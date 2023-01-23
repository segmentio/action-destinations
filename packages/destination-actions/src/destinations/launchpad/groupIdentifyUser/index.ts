import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getApiServerUrl } from '../utils'
import type { Payload } from './generated-types'

const groupIdentifyUser: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify User',
  description:
    'Updates or adds properties to a group profile. The profile is created if it does not exist. [Learn more about Group Analytics.](https://help.Launchpad.pm)',
  defaultSubscription: 'type = "group"',
  fields: {
    groupKey: {
      label: 'Group Key',
      type: 'string',
      description:
        'The group key you specified in Launchpad under Project settings. If this is not specified, it will be defaulted to "$group_id".'
    },
    groupId: {
      label: 'Group ID',
      type: 'string',
      description:
        'The unique identifier of the group. If there is a trait that matches the group key, it will override this value.',
      required: true,
      default: {
        '@path': '$.groupId'
      }
    },
    traits: {
      label: 'Group Properties',
      type: 'object',
      description: 'The properties to set on the group profile.',
      required: true,
      default: {
        '@path': '$.traits'
      }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      allowNull: true,
      description: 'The unique user identifier set by you',
      default: {
        '@path': '$.userId'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    if (!payload.traits || Object.keys(payload.traits).length === 0) {
      throw new IntegrationError('"traits" is a required field', 'Missing required fields', 400)
    }
    const groupId = payload.groupId
    const apiServerUrl = getApiServerUrl(settings.apiRegion)

    const transformed_traits = {
      ...Object.fromEntries(Object.entries(payload.traits).map(([k, v]) => [`group_${k}`, v]))
    }

    const groupIdentifyEvent = {
      event: '$identify',
      type: 'screen',
      $set: {
        group_id: groupId,
        ...transformed_traits
      },
      distinct_id: payload.userId,
      api_key: settings.apiSecret
    }
    const groupIdentifyResponse = await request(`${apiServerUrl}capture`, {
      method: 'post',
      json: groupIdentifyEvent
    })

    return groupIdentifyResponse
  }
}

export default groupIdentifyUser
