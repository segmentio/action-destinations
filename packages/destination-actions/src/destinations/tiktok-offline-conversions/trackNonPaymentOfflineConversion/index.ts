import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common_fields'
import { formatEmails, formatPhones, formatUserIds } from '../formatter'

const action: ActionDefinition<Settings, Payload> = {
  title: '[Deprecated] Non Payment Offline Conversion',
  description:
    '[Deprecated] Sends a non payment related event to the TikTok Offline Conversions API. Customers are advised to use the Offline Conversion instead.',
  fields: {
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    const phone_numbers = formatPhones(payload.phone_numbers)
    const emails = formatEmails(payload.email_addresses)
    const userIds = formatUserIds(payload.external_ids)

    if (phone_numbers.length < 1 && emails.length < 1 && userIds.length < 1) {
      throw new PayloadValidationError(
        'TikTok Offline Conversions API requires at least one of the following fields to be populatted: Emails, Phone Numbers, External ID'
      )
    }

    let urlTtclid
    if (payload.url) {
      try {
        urlTtclid = new URL(payload.url).searchParams.get('ttclid')
      } catch (error) {
        //  invalid url
      }
    }

    return request('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'post',
      json: {
        event_source: 'offline',
        event_source_id: settings.eventSetID,
        partner_name: 'Segment',
        data: [
          {
            event: payload.event,
            event_time: payload.timestamp
              ? Math.floor(new Date(payload.timestamp).getTime() / 1000)
              : Math.floor(new Date().getTime() / 1000),
            event_id: payload.event_id ? `${payload.event_id}` : undefined,
            user: {
              ttclid: payload.ttclid ? payload.ttclid : urlTtclid ? urlTtclid : undefined,
              external_id: userIds,
              phone: phone_numbers,
              email: emails,
              lead_id: payload.lead_id ? payload.lead_id : undefined,
              ttp: payload.ttp ? payload.ttp : undefined,
              ip: payload.ip ? payload.ip : undefined,
              user_agent: payload.user_agent ? payload.user_agent : undefined,
              locale: payload.locale ? payload.locale : undefined
            },
            properties: {
              query: payload.query ? payload.query : undefined,
              description: payload.description ? payload.description : undefined,
              order_id: payload.order_id ? payload.order_id : undefined,
              shop_id: payload.shop_id ? payload.shop_id : undefined
            },
            page: {
              url: payload.url ? payload.url : undefined,
              referrer: payload.referrer ? payload.referrer : undefined
            },
            limited_data_use: payload.limited_data_use ? payload.limited_data_use : false,
            test_event_code: payload.test_event_code ? payload.test_event_code : undefined
          }
        ]
      }
    })
  }
}

export default action
