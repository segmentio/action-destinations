import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View',
  description: 'Send page view events to GA4 to make the most of the recommended event reports in Google Analytics',
  defaultSubscription: 'type = "page"',
  fields: {
    clientId: {
      label: 'Client ID',
      description: 'Uniquely identifies a user instance of a web client.',
      type: 'string',
      required: true,
      default: {
        '@if': {
          exists: { '@path': '$.userId' },
          then: { '@path': '$.userId' },
          else: { '@path': '$.anonymousId' }
        }
      }
    },
    page_location: {
      label: 'Page Location',
      type: 'string',
      description: 'The current page URL',
      default: {
        '@path': '$.context.page.url'
      }
    },
    page_referrer: {
      label: 'Page Referrer',
      type: 'string',
      description: 'Previous page URL',
      default: {
        '@path': '$.context.page.referrer'
      }
    }
  },
  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.clientId,
        events: [
          {
            name: 'page_view',
            params: {
              page_location: payload.page_location,
              page_referrer: payload.page_referrer
            }
          }
        ]
      }
    })
  }
}

export default action
