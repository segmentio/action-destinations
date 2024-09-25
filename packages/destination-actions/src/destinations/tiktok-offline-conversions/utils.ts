import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Settings } from './generated-types'
import { Payload as ReportOfflineEventPayload } from './reportOfflineEvent/generated-types'
import { Payload as TrackNonPaymentOfflineConversionPayload } from './trackNonPaymentOfflineConversion/generated-types'
import { Payload as TrackPaymentOfflineConversionPayload } from './trackPaymentOfflineConversion/generated-types'
import { formatEmails, formatPhones, formatUserIds } from './formatter'

type OfflineEventPayload =
  | ReportOfflineEventPayload
  | TrackNonPaymentOfflineConversionPayload
  | TrackPaymentOfflineConversionPayload

export function performOfflineEvent(request: RequestClient, settings: Settings, payload: OfflineEventPayload) {
  const phone_numbers = formatPhones(payload.phone_numbers)
  const emails = formatEmails(payload.email_addresses)
  const userIds = formatUserIds(payload.external_ids)

  if (phone_numbers.length < 1 && emails.length < 1 && userIds.length < 1)
    throw new PayloadValidationError(
      'TikTok Offline Conversions API requires an email address and/or phone number and or a userId'
    )

  let payloadUrl, urlTtclid
  if (payload.url) {
    try {
      payloadUrl = new URL(payload.url)
    } catch (error) {
      //  invalid url
    }
  }

  if (payloadUrl) urlTtclid = payloadUrl.searchParams.get('ttclid')

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
            contents: payload.contents ? payload.contents : [],
            content_type: payload.content_type ? payload.content_type : undefined,
            currency: payload.currency ? payload.currency : undefined,
            value: payload.value || payload.value === 0 ? payload.value : undefined,
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
