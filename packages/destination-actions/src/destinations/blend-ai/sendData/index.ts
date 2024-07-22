import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const baseUrl = 'https://segment-api.blnd.ai/'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to Blend AI for product usage insights',
  fields: {},
  defaultSubscription: 'type = "identify" or type = "page" or type = "screen" or type = "track"',
  perform: (request, payload) => {
    return request(baseUrl + 'sendData', {
      json: { payload: payload }
    })
  }
}

export default action
