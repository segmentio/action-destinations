import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Forward to Courier',
  description: 'Forward track, group and identify events to Courier',
  defaultSubscription: `type = "track" or type = "identify" or type = "group"`,
  fields: {
    data: {
      label: 'Payload',
      description: 'All payload data',
      type: 'object',
      required: true,
      default: { '@path': '$.' },
      unsafe_hidden: true
    }
  },
  perform: (request, { settings, payload }) => {
    if (!['track', 'group', 'identify'].includes(payload.data.type as string)) {
      throw new PayloadValidationError('Event type must be either track, group or identify')
    }

    const domain = `https://api.${settings.region === 'EU' ? 'eu.' : ''}courier.com`
    const headers = {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    }

    return request(`${domain}/inbound/segment`, {
      method: 'POST',
      headers,
      json: payload.data
    })
  }
}

export default action
