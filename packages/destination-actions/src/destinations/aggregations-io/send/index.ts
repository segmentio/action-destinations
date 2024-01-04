import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Events',
  description: '',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen"',
  fields: {
    data: {
      label: 'Data',
      description: 'Payload to deliver (JSON-encoded).',
      type: 'object',
      default: { '@path': '$.' }
    },
    enable_batching: {
      label: 'Enable Batching',
      description: 'Enabling sending batches of events to Aggregations.io.',
      type: 'boolean',
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description:
        'Maximum number of events to include in each batch. Actual batch sizes may be lower. If you know your events are large, you may want to tune your batch size down to meet API requirements.',
      type: 'number',
      required: false,
      default: 300
    }
  },
  perform: (request, { settings, payload }) => {
    try {
      return request('https://ingest.aggregations.io/' + settings.ingest_id, {
        method: 'POST',
        json: [payload.data]
      })
    } catch (error) {
      if (error instanceof TypeError) throw new PayloadValidationError(error.message)
      throw error
    }
  },
  performBatch: (request, { settings, payload }) => {
    try {
      if (payload[0].enable_batching == false) {
        throw new PayloadValidationError('Batching Disabled')
      }
      return request('https://ingest.aggregations.io/' + settings.ingest_id, {
        method: 'POST',
        json: payload.map((x) => x.data)
      })
    } catch (error) {
      if (error instanceof TypeError) throw new PayloadValidationError(error.message)
      throw error
    }
  }
}

export default action
