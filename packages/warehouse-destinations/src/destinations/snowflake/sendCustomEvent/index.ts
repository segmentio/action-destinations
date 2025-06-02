import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Event',
  description: 'Record custom events in Snowflake',
  fields: {
    messageId: {
      label: 'Message ID',
      description: 'Name of column for the unique identifier for the message.',
      type: 'string',
      required: true,
      default: { '@path': '$.messageId' },
      readOnly: true
    },
    event: {
      label: 'Table Name',
      description: 'Name of the table. This will be the event name.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' },
      readOnly: true
    },
    type: {
      label: 'Event Type',
      description: 'The type of event',
      type: 'string',
      required: true,
      default: { '@path': '$.type' },
      readOnly: true
    },
    // note that this must be `properties` to be processed by the warehouse pipeline
    properties: {
      label: 'Columns',
      description: `Additional columns to write to Snowflake.`,
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: true,
      default: {
        entityContext: {
          '@json': {
            mode: 'encode',
            value: {
              '@path': '$.properties.data_graph_entity_context'
            }
          }
        },
        userId: { '@path': '$.userId' },
        audienceKey: { '@path': '$.properties.audience_key' },
        personasComputationKey: { '@path': '$.context.personas.computation_key' },
        personasComputationId: { '@path': '$.context.personas.computation_id' },
        personasComputationRunId: { '@path': '$.context.personas.computation_run_id' },
        personasActivationId: { '@path': '$.context.personas.event_emitter_id' }
      }
    },
    // include all segment timestamp fields - https://segment.com/docs/connections/spec/common/#timestamp-overview
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp of the event',
      type: 'datetime',
      required: true,
      default: { '@path': '$.timestamp' }
    },
    originalTimestamp: {
      label: 'Original Timestamp',
      description: 'Time on the client device when call was invoked.',
      type: 'datetime',
      required: true,
      default: { '@path': '$.originalTimestamp' }
    },
    sentAt: {
      label: 'Sent At',
      description: 'Time on client device when call was sent.',
      type: 'datetime',
      required: false,
      default: { '@path': '$.sentAt' }
    },
    receivedAt: {
      label: 'Received At',
      description: 'Time on Segment server clock when call was received.',
      type: 'datetime',
      required: false,
      default: { '@path': '$.receivedAt' }
    }
  },
  perform: () => {
    return undefined
  }
}

export default action
