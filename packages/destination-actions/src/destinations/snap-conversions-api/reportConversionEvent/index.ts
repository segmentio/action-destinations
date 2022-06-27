import { ActionDefinition, IntegrationError } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  event_type,
  event_conversion_type,
  event_tag,
  timestamp,
  email,
  mobile_ad_id,
  uuid_c1,
  idfv,
  phone_number,
  user_agent,
  ip_address,
  item_category,
  item_ids,
  description,
  number_items,
  price,
  currency,
  transaction_id,
  level,
  client_dedup_id,
  search_string,
  page_url,
  sign_up_method,
  formatPayload,
  CURRENCY_ISO_4217_CODES,
  conversionType
} from '../snap-capi-properties'

const CONVERSION_EVENT_URL = 'https://tr.snapchat.com/v2/conversion'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Conversion Event',
  description:
    'Report events directly to Snapchat. Data shared can power Snap solutions such as custom audience targeting, campaign optimization, Dynamic Ads, and more.',
  fields: {
    event_type: { ...event_type, required: true },
    event_conversion_type: { ...event_conversion_type, required: true },
    event_tag: event_tag,
    timestamp: { ...timestamp, required: true },
    email: email,
    mobile_ad_id: mobile_ad_id,
    uuid_c1: uuid_c1,
    idfv: idfv,
    phone_number: phone_number,
    user_agent: user_agent,
    ip_address: ip_address,
    item_category: item_category,
    item_ids: item_ids,
    description: description,
    number_items: number_items,
    price: price,
    currency: currency,
    transaction_id: transaction_id,
    level: level,
    client_dedup_id: client_dedup_id,
    search_string: search_string,
    page_url: page_url,
    sign_up_method: sign_up_method
  },
  perform: (request, data) => {
    const payload: Object = formatPayload(data.payload)
    const settings: Settings = conversionType(data.settings, data.payload.event_conversion_type)

    if (data.payload.currency && !CURRENCY_ISO_4217_CODES.has(data.payload.currency.toUpperCase())) {
      throw new IntegrationError(
        `${data.payload.currency} is not a valid currency code.`,
        'Misconfigured required field',
        400
      )
    }

    //Create Conversion Event Request
    return request(CONVERSION_EVENT_URL, {
      method: 'post',
      json: {
        ...payload,
        ...settings,
        integration: 'segment'
      }
    })
  }
}

export default action
