import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Post to Accoil',
  description: 'Send Data to Accoil Analytics',
  defaultSubscription: 'type = "track"',

  fields: {
    segmentEventData: {
      label: 'Event Payload',
      description: 'Segment Event Payload',
      type: 'object',
      unsafe_hidden: true,
      required: true,
      default: {
        '@path': '$'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const AUTH_KEY = Buffer.from(`${settings.api_key}:`).toString('base64')
    const auth_value = `Basic ${AUTH_KEY}`
    return request(`https://in.accoil.com/segment`, {
      method: 'post',
      headers: {
        Authorization: auth_value
      },
      json: payload.segmentEventData
    })
  }
}

export default action
