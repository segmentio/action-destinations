import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Event',
  description: 'Record custom events in Snowflake',
  fields: {
    timestamp: {
      label: 'Timestamp',
      description: 'Timestamp of the event',
      type: 'string',
      required: true,
      default: { '@path': '$.timestamp' }
    },
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
        userId: {
          label: 'User ID',
          description: 'Unique ID for the user.',
          type: 'string',
          default: { '@path': '$.userId' }
        },
        audienceKey: {
          label: 'Audience Key',
          description: 'The Kky of the audience.',
          type: 'string',
          default: { '@path': '$.properties.audience_key' }
        },
        personasComputationKey: {
          label: 'Personas Computation Key',
          description: 'Computation key set by Segment Personas.',
          type: 'string',
          default: { '@path': '$.context.personas.computation_key' }
        },
        personasComputationId: {
          label: 'Personas Computation ID',
          description: 'Computation ID set by Segment Personas.',
          type: 'string',
          default: { '@path': '$.context.personas.computation_id' }
        },
        personasComputationRunId: {
          label: 'Personas Computation Run ID',
          description: 'Unique ID for this run, set by Segment Personas.',
          type: 'string',
          default: { '@path': '$.context.personas.computation_run_id' }
        },
        personasActivationId: {
          label: 'Personas Activation ID',
          description: 'ID of the activation, set by Segment Personas.',
          type: 'string',
          default: { '@path': '$.context.personas.event_emitter_id' }
        }
      }
    }
  },
  perform: () => {
    return undefined
  }
}

export default action
