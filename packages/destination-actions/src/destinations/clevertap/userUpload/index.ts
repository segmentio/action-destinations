import type {ActionDefinition} from '@segment/actions-core'
import type {Settings} from '../generated-types'
import type {Payload} from './generated-types'
import type {ClevertapEvent} from "./types";
import type {MainEvent} from "./MainType";

const action: ActionDefinition<Settings, Payload> = {
  title: 'User Upload',
  description: 'The User Upload Action enables you to create or update user profiles in CleverTap.',
  fields: {
    ts: {
      label: 'Timestamp',
      type: 'integer',
      description:
        'The timestamp of the event. If time is not sent with the event, it will be set to the request upload time.',
    },
    profileData: {
      label: 'Profile Data',
      type: 'object',
      description: 'Profile Data',
    },
    identity: {
      label: 'Identity',
      type: 'string',
      description: 'Identity',
    },
  },


  perform: (request, {settings, payload}) => {
/*
    const datetime = payload.ts
    const time = datetime && dayjs.utc(datetime).isValid() ? dayjs.utc(datetime).valueOf() : Date.now()
*/

    const event: ClevertapEvent = {
      type: 'profile',
      source: 'Segment',
      profileData: payload.profileData,
      identity: payload.identity,
      ts:payload.ts
    }
    const mainEvent: MainEvent = {
      "d": [event]
    }

    return request('https://api.clevertap.com/1/upload', {
      method: 'post',
      json: mainEvent,
      headers: {
        "X-CleverTap-Account-Id": `${settings.clevertapAccountId}`,
        "X-CleverTap-Passcode": `${settings.clevertapPasscode}`
      }
    })
  }
}

export default action
