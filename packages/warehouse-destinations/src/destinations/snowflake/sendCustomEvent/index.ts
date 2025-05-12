import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Event',
  description: 'Record custom events in Snowflake',
  fields: {
    columns: {
      label: 'Columns',
      description: `Columns to write to Snowflake.`,
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: true,
      properties: {
        timestamp: {
          label: 'Timestamp',
          description: 'Timestamp of the event',
          type: 'string'
        },
        messageId: {
          label: 'Message ID',
          description: 'Name of column for the unique identifier for the message.',
          type: 'string'
        },
        computationId: {
          label: 'Computation ID',
          description: 'Audience ID',
          type: 'string'
        }
      },
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
