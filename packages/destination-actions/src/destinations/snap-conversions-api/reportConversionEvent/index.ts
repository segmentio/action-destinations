import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  products,
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
  brands,
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
  device_model,
  os_version,
  click_id
} from '../snap-capi-properties'
import { performSnapCAPIv2 } from './snap-capi-v2'
import { performSnapCAPIv3 } from './snap-capi-v3'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Report Conversion Event',
  description:
    'Report events directly to Snapchat. Data shared can power Snap solutions such as custom audience targeting, campaign optimization, Dynamic Ads, and more.',
  fields: {
    products: products,
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
    brands: brands,
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
    sign_up_method: sign_up_method,
    os_version: os_version,
    device_model: device_model,
    click_id: click_id
  },
  perform: async (request, data) => {
    const { features } = data
    const testCAPIv3 = features?.['actions-snap-api-migration-test-capiv3'] ?? false
    const useCAPIv3 = features?.['actions-snap-api-migration-use-capiv3'] ?? false

    // Intentionally check the test flag first and prefer the test branch
    // this is to prevent a bad config where both testCAPIv3 and useCAPIv3
    // are both set to true.
    if (testCAPIv3) {
      const [v2result, _v3result] = await Promise.all([
        performSnapCAPIv2(request, data),

        (async () => {
          try {
            return await performSnapCAPIv3(request, data)
          } catch (e) {
            // In test mode, we swallow any errors thrown by the v3 connector.
            // This is to prevent these errors from causing the segment client from
            // retrying requests caused by v3 errors, when v2 is the request of
            // record. Instead log the errors so that we can identify issues and resolve them.

            // FIXME: Should we add sampling here?
            data.logger?.info(String(e))
          }
        })()
      ])

      // In the test state, we send event to both the v2 and v3 endpoints
      // but only return the result of the v2 endpoint since v3's result
      // is only used by snap to verify.
      return v2result
    } else if (useCAPIv3) {
      return performSnapCAPIv3(request, data)
    } else {
      return performSnapCAPIv2(request, data)
    }
  }
}

export default action
