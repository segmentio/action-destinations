import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Events',
  description: 'Send events to Aggregations.io.',
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
      default: 300,
      readOnly: true,
      unsafe_hidden: true
    }
  },
  perform: (request, { settings, payload }) => {
    return request('https://ingest.aggregations.io/' + settings.ingest_id, {
      method: 'POST',
      json: [payload.data]
    })    
  },
  performBatch: (request, { settings, payload }) => {
    return request('https://ingest.aggregations.io/' + settings.ingest_id, {
      method: 'POST',
      json: payload.map((x) => x.data)
    })
  }
}

export default action
