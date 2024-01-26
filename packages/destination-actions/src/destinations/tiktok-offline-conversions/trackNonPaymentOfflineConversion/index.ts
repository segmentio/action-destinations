import { ActionDefinition, PayloadValidationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { commonFields } from '../common_fields'
import { formatEmails, formatPhones } from '../formatter'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Track Non Payment Offline Conversion',
  description: 'Send a non payment related event to the TikTok Offline Conversions API',
  fields: {
    ...commonFields
  },
  perform: (request, { payload, settings }) => {
    const phone_numbers = formatPhones(payload.phone_numbers)
    const emails = formatEmails(payload.email_addresses)

    if (phone_numbers.length < 1 && emails.length < 1)
      throw new PayloadValidationError('TikTok Offline Conversions API requires an email address and/or phone number')

    return request('https://business-api.tiktok.com/open_api/v1.3/offline/track/', {
      method: 'post',
      json: {
        event_set_id: settings.eventSetID,
        event: payload.event,
        event_id: payload.event_id ? `${payload.event_id}` : undefined,
        timestamp: payload.timestamp,
        context: {
          user: {
            phone_numbers,
            emails
          }
        },
        properties: {
          order_id: payload.order_id,
          shop_id: payload.shop_id,
          event_channel: payload.event_channel
        },
        partner_name: 'Segment'
      }
    })
  }
}

export default action
