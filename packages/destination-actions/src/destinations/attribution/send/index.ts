import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from './functions'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send',
  description: 'Send Segment events to Attribution',
  defaultSubscription: 'type = "track" or type = "page" or type = "screen" or type = "identify" or type = "group" or type = "alias"',
  fields: {
    messageId: {
      label: 'Message ID',
      description: 'The unique identifier for the event message.',
      type: 'string',
      required: true, 
      default: { '@path': '$.messageId' }
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event. If not provided, the current time will be used.',
      type: 'string',
      required: true, 
      default: { '@path': '$.timestamp' }
    },
    type: {
      label: 'Event Type',
      description: 'The type of event to send to Attribution.',
      type: 'string',
      required: true,
      choices: [
        { label: 'Track', value: 'track' },
        { label: 'Page', value: 'page' },
        { label: 'Screen', value: 'screen' },
        { label: 'Identify', value: 'identify' },
        { label: 'Group', value: 'group' },
        { label: 'Alias', value: 'alias' }
      ], 
      default: { '@path': '$.type' }
    },
    event: {
      label: 'Event Name',
      description: 'The name of the event to send to Attribution. Required for track events.',
      type: 'string',
      required: {
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'track'
          }
        ]
      }, 
      depends_on: {
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'track'
          }
        ]
      }, 
      default: { '@path': '$.event' }
    },
    name: {
      label: 'Name',
      description: 'The name of the page or screen.',
      type: 'string',
      required: false,
      depends_on: {
        match: 'any',
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'page'
          },
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'screen'
          }
        ]
      }, 
      default: { '@path': '$.name' }
    },
    properties: {
      label: 'Properties',
      description: 'The properties of the event to send to Attribution.',
      type: 'object',
      required: false,
      depends_on: {
        match: 'any',
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'track'
          },
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'page'
          },
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'screen'
          }
        ]
      }, 
      default: { '@path': '$.properties' }
    },
    traits: {
      label: 'Traits',
      description: 'The traits of the user to send to Attribution.',
      type: 'object',
      required: false,
      depends_on: {
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is_not',
            value: 'alias'
          }
        ]
      }, 
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.context.traits' }
        }
      }
    },
    userId: {
      label: 'User ID',
      description: 'The ID of the user to send to Attribution.',
      type: 'string',
      required: {
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'alias'
          }
        ]
      }, 
      default: { '@path': '$.userId' }
    },
    anonymousId: {
      label: 'Anonymous ID',
      description: 'The anonymous ID of the user to send to Attribution.',
      type: 'string',
      required: false, 
      default: { '@path': '$.anonymousId' }
    },
    groupId: {
      label: 'Group ID',
      description: 'The ID of the group to send to Attribution.',
      type: 'string',
      required: {
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'group'
          }
        ]
      },
      depends_on: {
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'group'
          }
        ] 
      }, 
      default: { '@path': '$.groupId' }
    }, 
    context: {
      label: 'Context',
      description: 'The context of the event to send to Attribution.',
      type: 'object',
      required: false, 
      default: { '@path': '$.context' }
    }, 
    previousId: {
      label: 'Previous ID',
      description: 'The previous ID of the user to send to Attribution.',
      type: 'string',
      required: false,
      depends_on: {
        conditions: [
          {
            fieldKey: 'type',
            operator: 'is',
            value: 'alias'
          }
        ] 
      }
    }
  },
  perform: (request, { payload }) => {
    return send(request, payload)
  }
}

export default action
