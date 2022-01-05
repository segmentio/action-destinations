import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {DeleteEvent} from "./types";

const action: ActionDefinition<Settings, Payload> = {
  title: 'User Delete',
  description: '',
  fields: {
    identity: {
      label: 'Identity',
      type: 'string',
      description: 'Identity',
      default: {'@path': '$.userId'},
      required: true
    },
  },
  perform: (request, {settings, payload}) => {
    const event: DeleteEvent = {
      identity: payload.identity,
    }
    return request(`${settings.clevertapEndpoint}/1/delete/profiles.json`, {
      method: 'post',
      json: event,
      headers: {
        "X-CleverTap-Account-Id": `${settings.clevertapAccountId}`,
        "X-CleverTap-Passcode": `${settings.clevertapPasscode}`
      }
    })
  }
}

export default action
