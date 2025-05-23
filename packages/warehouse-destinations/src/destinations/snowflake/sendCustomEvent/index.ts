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
    computationId: {
      label: 'Computation ID',
      description:
        'Audience or journey ID - hidden as we drop it in the warehouse pipeline, but need it for observability metrics.',
      type: 'string',
      required: true,
      default: { '@path': '$.context.personas.computation_id' },
      unsafe_hidden: true,
      readOnly: true
    },
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
        }
      }
    }
  },
  perform: () => {
    return undefined
  }
}

export default action
