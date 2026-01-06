import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../fields'
import { send } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Track a single event in Altertable.',
  defaultSubscription: 'type = "track"',
  fields: {
    type: {
      label: 'Segment Event Type',
      description: 'The Segment event type',
      type: 'string',
      choices: [
        { label: 'track', value: 'track' },
        { label: 'page', value: 'page' },
        { label: 'screen', value: 'screen' }
      ],
      required: true,
      default: 'track'
    },
    event: {
      label: 'Event Name',
      description: 'The name of the event to track. Only required for `track` event type.',
      type: 'string',
      default: {
        '@path': '$.event'
      },
      required: {
        conditions: [
          {
            fieldKey: 'eventType',
            operator: 'is',
            value: 'track'
          }
        ]
      },
      depends_on: {
        conditions: [
          {
            fieldKey: 'eventType',
            operator: 'is',
            value: 'track'
          }
        ]
      }
    },
    properties: {
      label: 'Properties',
      description: 'The properties of the event',
      type: 'object',
      required: true,
      default: {
        '@path': '$.properties'
      }
    },
    ...commonFields
  },
  perform: (request, { settings, payload }) => {
    return send(request, settings, payload)
  }
}


export default action
