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
      label: 'Created At',
      type: 'string',
      description: 'A timestamp when the person was created',
      default: {'@path': '$.timestamp'}
    },
    profileData: {
      label: 'Person Attributes',
      type: 'object',
      description: 'Optional attributes for the person. When updating a person attributes added or updated, not removed',
      default: {'@path': '$.properties'}
    },
    identity: {
      label: 'Identity',
      type: 'string',
      description: 'The Id used to uniquely identify a person in CleverTap',
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
