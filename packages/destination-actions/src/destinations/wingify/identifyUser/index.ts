import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../utility'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: "Maps Segment's visitor traits to the visitor attributes in Wingify",
  defaultSubscription: 'type = "identify"',
  fields: {
    attributes: {
      description: `Visitor's attributes to be mapped`,
      label: 'attributes',
      required: true,
      type: 'object',
      default: {
        '@path': '$.traits'
      }
    },
    wingifyUuid: {
      description: 'Wingify UUID',
      label: 'Wingify UUID',
      required: true,
      type: 'string',
      default: {
        '@path': '$.traits.wingify_uuid'
      }
    },
    page: {
      description: 'Contains context information regarding a webpage',
      label: 'Page',
      required: false,
      type: 'object',
      default: {
        '@path': '$.context.page'
      }
    },
    ip: {
      description:
        'IP address of the user. Only useful when events originate from Segment client libraries (web/mobile); server-side events will contain Segment server IPs.',
      label: 'IP Address',
      required: false,
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      description: 'User-Agent of the user',
      label: 'User Agent',
      required: false,
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    timestamp: {
      description: 'Timestamp on the event',
      label: 'Timestamp',
      required: false,
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    return send('wingify_syncVisitorProp', true, request, payload, settings, false)
  }
}

export default action