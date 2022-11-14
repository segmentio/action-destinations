import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Event',
  description: 'Sends track events to VWO',
  fields: {
    name: {
      description: 'The name of the event.',
      label: 'Name',
      required: true,
      type: 'string',
      default: {
        '@path': '$.event'
      }
    },
    properties: {
      description: 'A JSON object containing additional properties that will be associated with the event.',
      label: 'Properties',
      required: false,
      type: 'object',
      default: {
        '@path': '$.properties'
      }
    },
    vwo_uuid: {
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
    const formattedProperties = { ...payload.properties }
    const validDataTypes = ['string', 'boolean', 'number']
    const endpoint = `https://dev.visualwebsiteoptimizer.com/events/t?en=${payload.name}&a=${settings.vwoAccountId}`
    const vwo_uuid = formattedProperties.vwo_uuid
    delete formattedProperties['vwo_uuid']

    for (const key in formattedProperties) {
      if (!validDataTypes.includes(typeof formattedProperties[key])) {
        delete formattedProperties[key]
      }
    }
    const epochTime = new Date(payload.timestamp).valueOf()
    const time = Math.floor(epochTime)
    const sessionId = Math.floor(epochTime / 1000)
    const structuredPayload = {
      d: {
        msgId: `${vwo_uuid}-${sessionId}`,
        visId: vwo_uuid,
        event: {
          props: {
            ...formattedProperties,
            page: payload.page,
            isCustomEvent: true,
            vwoMeta: {
              metric: {}
            }
          },
          name: payload.name,
          time
        },
        sessionId
      }
    }
    return request(endpoint, {
      method: 'POST',
      json: structuredPayload
    })
  }
}

export default action
