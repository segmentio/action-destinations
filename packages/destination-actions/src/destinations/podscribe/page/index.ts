import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { serializeParams } from '../utils'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page',
  description: 'Register page view in Podscribe',
  defaultSubscription: 'type = "page"',
  fields: {
    anonymousId: {
      type: 'string',
      allowNull: true,
      description: 'The anonymous ID associated with the user',
      label: 'Anonymous ID',
      default: { '@path': '$.anonymousId' }
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      required: true,
      description: 'The timestamp of the event',
      label: 'Timestamp',
      default: { '@path': '$.timestamp' }
    },
    referrer: {
      type: 'string',
      allowNull: true,
      description: 'The page referrer',
      label: 'Page Referrer',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.referrer' },
          then: { '@path': '$.context.page.referrer' },
          else: { '@path': '$.properties.referrer' }
        }
      }
    },
    url: {
      type: 'string',
      format: 'uri',
      allowNull: true,
      description: 'The page URL',
      label: 'Page URL',
      default: {
        '@if': {
          exists: { '@path': '$.context.page.url' },
          then: { '@path': '$.context.page.url' },
          else: { '@path': '$.properties.url' }
        }
      }
    },
    ip: {
      label: 'User IP address',
      type: 'string',
      required: true,
      description: 'The IP address of the device sending the event.',
      default: {
        '@path': '$.context.ip'
      }
    },
    userAgent: {
      label: 'User Agent',
      type: 'string',
      description: 'The user agent of the device sending the event.',
      default: {
        '@path': '$.context.userAgent'
      }
    }
  },
  perform: (request, { settings, payload }) => {
    const params = serializeParams({
      action: 'view',
      advertiser: settings.advertiser,
      timestamp: payload.timestamp,
      device_id: payload.anonymousId,
      referrer: payload.referrer,
      url: payload.url,
      ip: payload.ip,
      user_agent: payload.userAgent
    })

    return request(`https://verifi.podscribe.com/tag?${params}`)
  }
}

export default action
