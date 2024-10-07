import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { SingleStoreMessage } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Data',
  description: 'Send data to Singlestore.',
  fields: {
    type: {
      label: 'Type',
      description: 'The type of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.type'
      }
    },
    event: {
      label: 'Event Name',
      description: 'The name of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.timestamp'
      }
    },
    messageId: {
      label: 'Message ID',
      description: 'The message ID of the event.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.messageId'
      }
    },
    message: {
      label: 'Message',
      description: 'The complete event payload.',
      type: 'string',
      required: true,
      default: {
        '@path': '$.'
      }
    }
  },
  perform: (_, { payload, settings }) => {
    
    const message: SingleStoreMessage = {
      type: payload.type,
      event: payload.event,
      timestamp: payload.timestamp,
      messageId: payload.messageId,
      message: payload.message
    }

    return message
    
  }
}

export default action
