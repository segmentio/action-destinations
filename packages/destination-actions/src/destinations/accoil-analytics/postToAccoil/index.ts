import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post to Accoil',
  description: 'Send Data to Accoil Analytics',
  defaultSubscription: 'type = "track"',

  fields: {},
  perform: (request, { settings, payload }) => {
    const AUTH_KEY = settings.api_key + ':'
    return request(`https://in.accoil.com/segment`, {
      method: 'post',
      headers: {
        Authorization: `Basic ${Buffer.from(AUTH_KEY).toString('base64')}`
      },
      json: payload
    })
  }
}

export default action
