import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPayload, formatAttributes } from '../utility'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: "Maps Segment's visitor traits to the visitor attributes in VWO",
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
    vwoUuid: {
      description: 'VWO UUID',
      label: 'VWO UUID',
      required: true,
      type: 'string',
      default: {
        '@path': '$.traits.vwo_uuid'
      }
    },
    page: {
      description: 'Contains context information regarding a webpage',
      label: 'Page',
      required: true,
      type: 'object',
      default: {
        '@path': '$.context.page'
      }
    },
    ip: {
      description: 'IP address of the user',
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
      required: true,
      type: 'string',
      default: {
        '@path': '$.context.userAgent'
      }
    },
    timestamp: {
      description: 'Timestamp on the event',
      label: 'Timestamp',
      required: true,
      type: 'string',
      default: {
        '@path': '$.timestamp'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const eventName = 'vwo_syncVisitorProp'
    const attributes = payload.attributes
    delete attributes['vwo_uuid']
    const visitor = { props: formatAttributes(attributes) }
    const { headers, structuredPayload } = formatPayload(eventName, payload, true)
    structuredPayload.d.visitor = structuredPayload.d.event.props['$visitor'] = visitor
    const endpoint = `https://dev.visualwebsiteoptimizer.com/events/t?en=${eventName}&a=${settings.vwoAccountId}`
    return request(endpoint, {
      method: 'POST',
      json: structuredPayload,
      headers
    })
  }
}

export default action
