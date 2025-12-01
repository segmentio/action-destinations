import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import dayjs from '../../../lib/dayjs'
import { getEndpointByRegion } from '../common-functions'
import { common_fields } from '../fields/common-fields'
import { group_properties, group_type, group_value } from './fields'
import { device_id, time, insert_id } from '../fields/misc-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Group Identify User',
  description:
    'Set or update properties of particular groups. Note that these updates will only affect events going forward.',
  defaultSubscription: 'type = "group"',
  fields: {
    ...common_fields,
    user_id: {
      ...common_fields.user_id,
      description: 'A UUID (unique user ID) specified by you. **Note:** If you send a request with a user ID that is not in the Amplitude system yet, then the user tied to that ID will not be marked new until their first event. If either user ID or device ID is present, an associate user to group call will be made.'
    },
    time,
    insert_id,
    device_id,
    group_properties,
    group_type,
    group_value
  },
  perform: async (request, { payload, settings }) => {
    const groupAssociation = { [payload.group_type]: payload.group_value }
    const { min_id_length } = payload
    let options
    if (min_id_length && min_id_length > 0) {
      options = JSON.stringify({ min_id_length })
    }

    // Associate user to group if user_id or device_id is present
    if (payload.user_id || payload.device_id) {
      await request(getEndpointByRegion('identify', settings.endpoint), {
        method: 'post',
        body: new URLSearchParams({
          api_key: settings.apiKey,
          identification: JSON.stringify([
            {
              device_id: payload.device_id,
              groups: groupAssociation,
              insert_id: payload.insert_id,
              library: 'segment',
              time: dayjs.utc(payload.time).valueOf(),
              user_id: payload.user_id,
              user_properties: groupAssociation
            }
          ]),
          options
        } as Record<string, string>)
      })
    }

    // Associate group properties
    return request(getEndpointByRegion('groupidentify', settings.endpoint), {
      method: 'post',
      body: new URLSearchParams({
        api_key: settings.apiKey,
        identification: JSON.stringify([
          {
            group_properties: payload.group_properties,
            group_value: payload.group_value,
            group_type: payload.group_type,
            library: 'segment'
          }
        ]),
        options
      } as Record<string, string>)
    })
  }
}

export default action
