import type { ActionDefinition } from '@segment/actions-core'
import { PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward to Courier',
  description: 'Forward track, group and identify events to Courier',
  fields: {},
  defaultSubscription: `type = "track" or type = "identify" or type = "group"`,
  perform: (request, { settings, payload }) => {
    const domain = `https://api.${settings.region === 'EU' ? 'eu.' : ''}courier.com`
    const headers = {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    }
    if (!['track', 'identify', 'group'].includes(payload['type'])) {
      throw new PayloadValidationError(`Invalid event type: ${payload['type']}`)
    } else {
      return request(`${domain}/inbound/segment`, {
        method: 'POST',
        headers,
        json: payload
      })
    }
  }
}

export default action
