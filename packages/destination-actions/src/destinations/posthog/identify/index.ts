import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

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
        '@path': '$.receivedAt'
      },
      required: false
    }
  },
  perform: (request, data) => {
    const url = `${data.settings.endpoint}/i/v0/e/`
    const headers = {
      'Content-Type': 'application/json'
    }
    const payload = {
      api_key: data.settings.api_key,
      distinct_id: data.payload.distinct_id,
      properties: {
        $set: data.payload.properties
      },
      timestamp: data.payload.timestamp
    }
    return request(url, {
      method: 'post',
      headers,
      body: JSON.stringify(payload)
    })
  }
}

export default action
