import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import type { IdentifyEvent } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Identify',
  description:
    'Updates person properties. Read more in our [identify docs](https://posthog.com/docs/product-analytics/identify).',
  fields: {
    distinct_id: {
      label: 'Distinct ID',
      description: 'The distinct ID of the user',
      type: 'string',
      default: {
        '@path': '$.userId'
      },
      required: true
    },
    properties: {
      label: 'Properties',
      description: 'The properties of the user',
      type: 'object',
      default: {
        '@path': '$.traits'
      },
      required: true
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of the event',
      type: 'datetime',
      default: {
        '@path': '$.timestamp'
      },
      required: false
    }
  },
  perform: (request, { payload, settings }) => {
    const url = `${settings.endpoint}/i/v0/e/`
    const headers = {
      'Content-Type': 'application/json'
    }
    const json: IdentifyEvent = {
      event: '$identify',
      api_key: settings.api_key,
      distinct_id: payload.distinct_id,
      properties: {
        $set: payload.properties
      },
      timestamp: payload.timestamp
    }
    return request(url, {
      method: 'post',
      headers,
      json
    })
  }
}

export default action
