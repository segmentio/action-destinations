import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPayload } from '../utility'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page Visit',
  description: 'Sends page visit information to VWO',
  fields: {
    url: {
      description: 'The URL of the page',
      label: 'Page URL',
      required: true,
      type: 'string',
      default: {
        '@path': '$.context.page.url'
      }
    },
    vwoUuid: {
      description: 'VWO UUID',
      label: 'VWO UUID',
      required: true,
      type: 'string',
      default: {
        '@path': '$.properties.vwo_uuid'
      }
    },
    page: {
      description: 'Page Context',
      label: 'Page',
      required: true,
      type: 'object',
      default: {
        '@path': '$.context.page'
      }
    },
    ip: {
      description: 'IP Address',
      label: 'IP Address',
      required: false,
      type: 'string',
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      description: 'User Agent',
      label: 'User Agent',
      required: true,
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    timestamp: {
      description: 'Timestamp',
      label: 'Timestamp',
      required: true,
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  defaultSubscription: 'type = "page"',
  perform: (request, { settings, payload }) => {
    const eventName = 'vwo_pageView'
    const { headers, structuredPayload } = formatPayload(eventName, payload, false)
    structuredPayload.d.event.props['url'] = payload.url
    const endpoint = `https://dev.visualwebsiteoptimizer.com/events/t?en=${eventName}&a=${settings.vwoAccountId}`
    return request(endpoint, {
      method: 'POST',
      json: structuredPayload,
      headers
    })
  }
}

export default action
