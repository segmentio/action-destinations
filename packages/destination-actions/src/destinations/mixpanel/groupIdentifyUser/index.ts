import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import { getApiServerUrl } from '../utils'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify User',
  description:
    'Updates or adds properties to a group profile. The profile is created if it does not exist. [Learn more about Group Analytics.](https://help.mixpanel.com/hc/en-us/articles/360025333632-Group-Analytics?source=segment-actions)',
  defaultSubscription: 'type = "group"',
  fields: {
    group_key: {
      label: 'Group Key',
      type: 'string',
      description:
        'The group key you specified in Mixpanel under Project settings. If this is not specified, it will be defaulted to "$group_id".'
    },
    group_id: {
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
      default: {
        '@path': '$.traits'
      }
    }
  },
  perform: (request, { payload, settings }) => {
    const group_key = payload.group_key || '$group_id'
    if (!payload.traits) {
      throw new IntegrationError('"traits" is a required field', 'Missing required fields', 400)
    }
    /*
     * Getting the group id from payload.traits[group_key] is primarily for backwards compatibility with the “classic” Segment integration.
     * In that integration, you specify the id as a trait like {[group_key]: group_id} and the group_id from the Segment payload was ignored.
     * Now, we simplify this by using the group_id from the segment payload directly.
     */
    const group_id = payload.traits[group_key] || payload.group_id

    const data = {
      $token: settings.projectToken,
      $group_key: group_key,
      $group_id: group_id,
      $set: payload.traits
    }

    return request(`${getApiServerUrl(settings.apiRegion)}/groups`, {
      method: 'post',
      body: new URLSearchParams({ data: JSON.stringify(data) })
    })
  }
}

export default action
