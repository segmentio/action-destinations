import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPayload, formatAttributes } from '../utility'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify User',
  description: "Maps segment's visitor traits to VWO visitors' attributes",
  defaultSubscription: 'type = "identify"',
  fields: {
    attributes: {
      description: 'A JSON object containing additional attributes that will be associated with the event.',
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
