import type {ActionDefinition} from '@segment/actions-core'
import type {Settings} from '../generated-types'
import type {Payload} from './generated-types'
import type {ClevertapEvent} from "./types";

const type = 'profile';
const source = 'Segment';
const action: ActionDefinition<Settings, Payload> = {
  title: 'User Upload',
  description: 'The User Upload Action enables you to create or update user profiles in CleverTap.',
  fields: {
    ts: {
      label: 'Timestamp',
      type: 'string',
      description: 'The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.',
      default: {'@path': '$.timestamp'}
    },
    profileData: {
      label: 'Profile Data',
      type: 'object',
      description: 'Profile Data',
      default: {'@path': '$.properties'}
    },
    identity: {
      label: 'Identity',
      type: 'string',
      description: 'Identity',
      default: {'@path': '$.userId'},
      required: true
    },
  },


  perform: (request, {settings, payload}) => {
    const event: ClevertapEvent = {
      type: type,
      source: source,
      profileData: payload.profileData,
      identity: payload.identity,
      ts: payload.ts
    }

    return request(`${settings.clevertapEndpoint}/1/upload`, {
      method: 'post',
      json: {
        "d": [event]
      },
      headers: {
        "X-CleverTap-Account-Id": `${settings.clevertapAccountId}`,
        "X-CleverTap-Passcode": `${settings.clevertapPasscode}`
      }
    })
  }
}

export default action
