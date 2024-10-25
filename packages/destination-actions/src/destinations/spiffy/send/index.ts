import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

// @ts-ignore - typescript doesnt like we are operating on an any request object
async function sendData(request, settings: Settings, payloads: Payload[]) {
  const environment = settings.environment
  const url =
    environment == 'prod'
      ? 'https://segment-intake.spiffy.ai/v1/intake'
      : 'https://segment-intake.dev.spiffy.ai/v1/intake'
  return request(url, {
    method: 'put',
    json: {
      payload: JSON.stringify(payloads)
    }
  })
}

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send data to Spiffy.AI',
  defaultSubscription: 'type = "track" or type = "identify" or type = "page" or type = "screen" or type = "group"',
  fields: {
    payload: {
      label: 'Payload',
      description: 'The data to send to Spiffy.AI',
      type: 'object',
      required: true,
      default: { '@path': '$.' }
    },
    headers: {
      label: 'Headers',
      description: 'Header data to send to Spiffy. Format is Header key, Header value (optional).',
      type: 'object',
      defaultObjectUI: 'keyvalue:only'
    }
  },
  perform: async (request, { settings, payload }) => {
    return sendData(request, settings, [payload])
  },
  performBatch: async (request, { settings, payload }) => {
    return sendData(request, settings, payload)
  }
}

export default action
