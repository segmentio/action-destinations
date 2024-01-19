import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward to Courier',
  description: 'Forward track, group and identify events to Courier',
  fields: {},
  // defaultSubscription: 'type = "track" or type = "group" or type = "identify"',
  perform: (request, { settings, payload }) => {
    const domain = `https://api.${settings.region === 'EU' ? 'eu.' : ''}courier.com`
    const headers = {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    }
    console.log({ request })
    return request.post(`${domain}/inbound/segment`, {
      responseType: 'json',
      headers,
      json: payload
    })
  }
}

export default action
