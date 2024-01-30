import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post to Accoil',
  description: 'Send Data to Accoil Analytics',
  defaultSubscription: 'type = "track"',

  fields: {},
  perform: (request, { settings, payload }) => {
    const AUTH_KEY = Buffer.from(`${settings.api_key}:`).toString('base64')
    return request(`https://in.accoil.com/segment`, {
      method: 'post',
      headers: {
        Authorization: `Basic ${AUTH_KEY}`
      },
      json: payload
    })
  }
}

export default action
