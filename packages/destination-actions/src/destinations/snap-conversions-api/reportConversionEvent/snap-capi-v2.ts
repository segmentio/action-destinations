import { ExecuteInput, IntegrationError, ModifiedResponse, RequestClient } from '@segment/actions-core'
import { Settings } from '../generated-types'
import { Payload } from './generated-types'
import { CURRENCY_ISO_4217_CODES } from '../snap-capi-properties'
import { isHashedEmail, hash, transformProperty } from './utils'

//Check to see what ids need to be passed depending on the event_conversion_type
const conversionType = (oldSettings: Settings, event_conversion_type: String): Settings => {
  // copy on write
  const settings = { ...oldSettings }

  if (event_conversion_type === 'MOBILE_APP') {
    if (!settings?.snap_app_id || !settings?.app_id) {
      throw new IntegrationError(
        'If event conversion type is "MOBILE_APP" then Snap App ID and App ID must be defined',
        'Misconfigured required field',
        400
      )
    }
    delete settings?.pixel_id
  } else {
    if (!settings?.pixel_id) {
      throw new IntegrationError(
        `If event conversion type is "${event_conversion_type}" then Pixel ID must be defined`,
        'Misconfigured required field',
        400
      )
    }
    delete settings?.snap_app_id
    delete settings?.app_id
  }
  return settings
}

const formatPayload = (oldPayload: Payload): Object => {
  // copy on write
  const payload = { ...oldPayload }

  //Normalize fields based on Snapchat Data Hygiene https://marketingapi.snapchat.com/docs/conversion.html#auth-requirements
  if (payload.email) {
    //Removes all leading and trailing whitespace and converts all characters to lowercase.
    payload.email = payload.email.replace(/\s/g, '').toLowerCase()
  }

  if (payload.phone_number) {
    //Removes all non-numberic characters and leading zeros.
    payload.phone_number = payload.phone_number.replace(/\D|^0+/g, '')
  }

  if (payload.mobile_ad_id) {
    //Converts all characters to lowercase
    payload.mobile_ad_id = payload.mobile_ad_id.toLowerCase()
  }

  let item_ids: string | undefined = undefined
  let item_category: string | undefined = undefined
  let brands: string[] | undefined = undefined

  // if customer populates products array, use it instead of individual fields
  const p = payload?.products
  if (p && Array.isArray(p) && p.length > 0) {
    item_ids = transformProperty('item_id', p)
    item_category = transformProperty('item_category', p)
    brands = p.map((product) => product.brand ?? '')
  }

  return {
    event_type: payload?.event_type,
    event_conversion_type: payload?.event_conversion_type,
    event_tag: payload?.event_tag,
    timestamp: Date.parse(payload?.timestamp),
    hashed_email: isHashedEmail(String(payload?.email)) ? payload?.email : hash(payload?.email),
    hashed_mobile_ad_id: hash(payload?.mobile_ad_id),
    uuid_c1: payload?.uuid_c1,
    hashed_idfv: hash(payload?.idfv),
    hashed_phone_number: hash(payload?.phone_number),
    user_agent: payload?.user_agent,
    hashed_ip_address: hash(payload?.ip_address),
    item_category: item_category ?? payload?.item_category,
    brands: brands ?? payload?.brands,
    item_ids: item_ids ?? payload?.item_ids,
    description: payload?.description,
    number_items: payload?.number_items,
    price: payload?.price,
    currency: payload?.currency,
    transaction_id: payload?.transaction_id,
    level: payload?.level,
    client_dedup_id: payload?.client_dedup_id,
    search_string: payload?.search_string,
    page_url: payload?.page_url,
    sign_up_method: payload?.sign_up_method,
    device_model: payload?.device_model,
    os_version: payload?.os_version,
    click_id: payload?.click_id
  }
}

const CONVERSION_EVENT_URL = 'https://tr.snapchat.com/v2/conversion'

export const performSnapCAPIv2 = (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload>
): Promise<ModifiedResponse<unknown>> => {
  if (data.payload.currency && !CURRENCY_ISO_4217_CODES.has(data.payload.currency.toUpperCase())) {
    throw new IntegrationError(
      `${data.payload.currency} is not a valid currency code.`,
      'Misconfigured required field',
      400
    )
  }

  if (
    !data.payload.email &&
    !data.payload.phone_number &&
    !data.payload.mobile_ad_id &&
    (!data.payload.ip_address || !data.payload.user_agent)
  ) {
    throw new IntegrationError(
      `Payload must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields`,
      'Misconfigured required field',
      400
    )
  }

  const payload: Object = formatPayload(data.payload)
  const settings: Settings = conversionType(data.settings, data.payload.event_conversion_type)

  //Create Conversion Event Request
  return request(CONVERSION_EVENT_URL, {
    method: 'post',
    json: {
      integration: 'segment',
      ...payload,
      ...settings
    }
  })
}
