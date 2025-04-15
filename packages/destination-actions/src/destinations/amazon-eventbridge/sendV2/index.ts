import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../functionsv2'

const action: ActionDefinition<Settings, Payload> = {
  title: 'SendV2',
  description: 'Send an event to Amazon EventBridge.',
  fields: {
    data: {
      label: 'Detail',
      description: 'The event data to send to Amazon EventBridge.',
      type: 'object',
      default: { '@path': '$.' },
      required: true
    },
    detailType: {
      label: 'Detail Type',
      description: `Detail Type of the event. Used to determine what fields to expect in the event Detail. 
                    Value cannot be longer than 128 characters.`,
      type: 'string',
      maximum: 128,
      default: { '@path': '$.type' },
      required: true
    },
    sourceId: {
      label: 'Source ID',
      description: 'The source ID for the event. HIDDEN FIELD',
      type: 'string',
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.context.protocols.sourceId' },
          then: { '@path': '$.context.protocols.sourceId' },
          else: { '@path': '$.projectId' }
        }
      },
      required: true
    },
    resources: {
      label: 'Resources',
      description: `AWS resources, identified by Amazon Resource Name (ARN), 
                    which the event primarily concerns. Any number, 
                    including zero, may be present.`,
      type: 'string',
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      },
      required: false
    },
    time: {
      label: 'Time',
      description: 'The timestamp the event occurred.',
      type: 'string',
      default: { '@path': '$.timestamp' },
      required: false
    },
    enable_batching: {
      type: 'boolean',
      label: 'Enable Batching',
      description: 'Enable Batching',
      unsafe_hidden: false,
      required: true,
      default: true
    },
    batch_size: {
      label: 'Batch Size',
      description: `Maximum number of events to include in each batch. 
                    Actual batch sizes may be lower.`,
      type: 'number',
      unsafe_hidden: true,
      required: false,
      default: 20,
      minimum: 1,
      maximum: 20
    }
  },
  perform: (_, data) => {
    const { payload, settings } = data
    return send([payload], settings)
  },
  performBatch: (_, data) => {
    const { payload, settings } = data
    return send(payload, settings)
  }
}

export default action
