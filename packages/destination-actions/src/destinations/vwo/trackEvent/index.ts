import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatPayload, sanitiseEventName } from '../utility'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: `Sends Segment's track event to VWO`,
  defaultSubscription: 'type = "track"',
  fields: {
    name: {
      description: 'Name of the event',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'JSON object containing additional properties that will be associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
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
    const sanitisedEventName = sanitiseEventName(payload.name)
    const { headers, structuredPayload } = formatPayload(sanitisedEventName, payload, true, true)
    structuredPayload.d.event.props.vwoMeta['ogName'] = payload.name
    const endpoint = `https://dev.visualwebsiteoptimizer.com/events/t?en=${sanitisedEventName}&a=${settings.vwoAccountId}`
    return request(endpoint, {
      method: 'POST',
      headers,
      json: structuredPayload
    })
  }
}

export default action
