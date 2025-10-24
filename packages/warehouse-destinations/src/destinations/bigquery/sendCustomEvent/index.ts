import { ActionDefinition } from '@segment/actions-core/destination-kit'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Custom Event',
  description: 'Record custom events in BigQuery',
  fields: {
    event: {
      label: 'Table Name',
      description: 'The name of the table.',
      type: 'string',
      required: true,
      default: { '@path': '$.event' },
      unsafe_hidden: true
    },
    // note that this must be `properties` to be processed by the warehouse pipeline
    properties: {
      label: 'Columns',
      description: `Additional columns to write to BigQuery.`,
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: true,
      default: {
        user_id: { '@path': '$.userId' }
      }
    },
    // These are all required for data to be processed by the warehouse pipeline
    messageId: {
      label: 'ID',
      description: 'Name of column for the unique identifier for the message.',
      type: 'string',
      required: true,
      default: { '@path': '$.messageId' },
      readOnly: true
    },
    type: {
      label: 'Event Type',
      description: 'The type of event.',
      type: 'string',
      required: true,
      default: { '@path': '$.type' },
      readOnly: true,
      // this is required for the warehouse pipeline to process the event,
      // but it's removed before being sent to BigQuery
      unsafe_hidden: true
    },
    receivedAt: {
      label: 'Received At',
      description: 'Time when event was received.',
      type: 'datetime',
      required: true,
      default: { '@path': '$.receivedAt' }
    }
  },
  perform: () => {
    return undefined
  }
}

export default action
