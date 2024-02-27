import type { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { verifyParams, verifyUserProps, convertTimestamp } from '../ga4-functions'
import {
  formatUserProperties,
  user_properties,
  params,
  user_id,
  client_id,
  engagement_time_msec,
  timestamp_micros
} from '../ga4-properties'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Page View',
  description: 'Send page view when a user views a page',
  defaultSubscription: 'type = "page"',
  fields: {
    clientId: { ...client_id },
    user_id: { ...user_id },
    timestamp_micros: { ...timestamp_micros },
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
    engagement_time_msec: engagement_time_msec,
    params: params
  },
  perform: (request, { payload }) => {
    verifyParams(payload.params)
    verifyUserProps(payload.user_properties)

    const request_object: { [key: string]: any } = {
      client_id: payload.clientId,
      user_id: payload.user_id,
      events: [
        {
          name: 'page_view',
          params: {
            page_location: payload.page_location,
            page_referrer: payload.page_referrer,
            page_title: payload.page_title,
            engagement_time_msec: payload.engagement_time_msec,
            ...payload.params
          }
        }
      ],
      ...formatUserProperties(payload.user_properties),
      timestamp_micros: convertTimestamp(payload.timestamp_micros)
    }

    return request('https://gtmadapter-node-cbjg5cz5hq-ew.a.run.app/v2/consolidated-data', {
      method: 'POST',
      json: request_object
    })
  }
}

export default action
