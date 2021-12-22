import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'
import { commonFields } from '../common-fields'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Contactactivity',
  description: "Create Cordial Contactactivity from Segment's track and page events",
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    ...commonFields,
    action: {
      label: 'Event name',
      description: 'Segment event name',
      type: 'string',
      required: true,
      default: {
        '@path': '$.event'
      }
    },
    time: {
      label: 'Event sentAt',
      description: 'Segment event sentAt',
      type: 'datetime',
      default: {
        '@path': '$.sentAt'
      }
    },
    properties: {
      label: 'Event properties',
      description: 'Segment event properties',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.addContactActivity(payload)
  }
}

export default action
