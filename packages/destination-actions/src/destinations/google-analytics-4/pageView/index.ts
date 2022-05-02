import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { formatUserProperties, user_properties, params, user_id, client_id } from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View',
  description: 'Send page view when a user views a page',
  defaultSubscription: 'type = "page"',
  fields: {
    clientId: { ...client_id },
    user_id: { ...user_id },
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
    },
    user_properties: user_properties,
    page_title: {
      label: 'Page Title',
      type: 'string',
      description: 'The current page title',
      default: {
        '@path': '$.context.page.title'
      }
    },
    params: params
  },
  perform: (request, { payload }) => {
    return request('https://www.google-analytics.com/mp/collect', {
      method: 'POST',
      json: {
        client_id: payload.clientId,
        user_id: payload.user_id,
        events: [
          {
            name: 'page_view',
            params: {
              page_location: payload.page_location,
              page_referrer: payload.page_referrer,
              page_title: payload.page_title,
              ...payload.params
            }
          }
        ],
        ...formatUserProperties(payload.user_properties)
      }
    })
  }
}

export default action
