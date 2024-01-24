import { ActionDefinition } from '@segment/actions-core'
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
      required: false,
      description:
        'The group key you specified in Launchpad under the company corresponding to the group. If this is not specified, it will be defaulted to "$group_id". This is helpful when you have a group of companies that should be joined together as in when you have a multinational.'
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
      required: false,
      default: {
        '@path': '$.traits'
      }
    },
    userId: {
      label: 'User ID',
      type: 'string',
      description:
        'A unique ID for a known user. This will be used as the Distinct ID. This field is required if the Anonymous ID field is empty',
      default: {
        '@path': '$.userId'
      }
    },
    anonymousId: {
      label: 'Anonymous ID',
      type: 'string',
      description:
        'A unique ID for an anonymous user. This will be used as the Distinct ID if the User ID field is empty. This field is required if the User ID field is empty',
      default: {
        '@path': '$.anonymousId'
      }
    }
  },

  perform: async (request, { payload, settings }) => {
    const groupId = payload.groupId
    const apiServerUrl = getApiServerUrl(settings.apiRegion)
    let transformed_traits

    if (payload.traits) {
      transformed_traits = {
        ...Object.fromEntries(Object.entries(payload.traits).map(([k, v]) => [`group_${k}`, v]))
      }
    }
    const groupIdentifyEvent = {
      event: '$identify',
      type: 'screen',
      $set: {
        group_id: groupId,
        ...transformed_traits
      },
      distinct_id: payload.userId ? payload.userId : payload.anonymousId,
      user_id: payload.userId,
      anonymoud_id: payload.anonymousId,
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
