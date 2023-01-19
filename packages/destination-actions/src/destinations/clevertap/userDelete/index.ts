import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { DeleteEvent } from './types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'User Delete',
  description: 'The User Delete Action enables you to remove user profiles in CleverTap.',
  fields: {
    identity: {
      label: 'Identity',
      type: 'string',
      description: 'The ID of the profile which you want to delete',
      default: { '@path': '$.userId' },
      required: true
    }
  },
  perform: (request, { settings, payload }) => {
    const event: DeleteEvent = {
      identity: payload.identity
    }
    return request(`${settings.clevertapEndpoint}/1/delete/profiles.json`, {
      method: 'post',
      json: event,
      headers: {
        'X-CleverTap-Account-Id': `${settings.clevertapAccountId}`,
        'X-CleverTap-Passcode': `${settings.clevertapPasscode}`
      }
    })
  }
}

export default action
