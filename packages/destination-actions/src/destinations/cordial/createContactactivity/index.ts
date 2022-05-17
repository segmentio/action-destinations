import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import CordialClient from '../cordial-client'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Create Contactactivity',
  description: 'Create a new contact activity.',
  defaultSubscription: 'type = "track" or type = "page"',
  fields: {
    userIdentities: {
      label: 'User Identities',
      description:
        'An ordered list of contact identifiers in Cordial. Each item in the list represents an identifier. For example, `channels.email.address -> userId` and/or `customerId -> traits.customerId`. At least one identifier should be valid otherwise the contact will not be identified and the request will be ignored.',
      type: 'object',
      required: true,
      defaultObjectUI: 'keyvalue:only'
    },
    action: {
      label: 'Event name',
      description: 'Event name. Required.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.event' },
          then: { '@path': '$.event' },
          else: 'pageView'
        }
      }
    },
    time: {
      label: 'Event timestamp',
      description:
        'Event timestamp. Optional. Date format is ISO 8601 standard. If empty, the request upload time will be used. ',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      }
    },
    properties: {
      label: 'Event properties',
      description: 'An object of additional event attributes. Optional.',
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    context: {
      label: 'Event context',
      description:
        'Event context as it appears in Segment. Optional. We use context to capture event metadata like sender ip and device info.',
      type: 'object',
      default: {
        '@path': '$.context'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const client = new CordialClient(settings, request)
    return client.addContactActivity(payload)
  }
}

export default action
