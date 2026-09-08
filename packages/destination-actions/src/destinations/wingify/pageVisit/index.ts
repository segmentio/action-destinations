import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { send } from '../utility'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Visit',
  description: `Sends Segment's page event to Wingify`,
  defaultSubscription: 'type = "page"',
  fields: {
    url: {
      description: 'URL of the webpage',
      label: 'Page URL',
      required: false,
      type: 'string',
      default: {
        '@path': '$.context.page.url'
      }
    },
    wingifyUuid: {
      description: 'Wingify UUID',
      label: 'Wingify UUID',
      required: true,
      type: 'string',
      default: {
        '@path': '$.properties.wingify_uuid'
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
   return send('pageView', false, request, payload, settings)
  }
}

export default action
