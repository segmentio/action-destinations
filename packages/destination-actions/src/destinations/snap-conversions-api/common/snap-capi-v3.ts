import { ExecuteInput } from '@segment/actions-core'
import { Payload } from '../reportConversionEvent/generated-types'
import { Settings } from '../generated-types'
import {
  box,
  emptyObjectToUndefined,
  hash,
  hashEmailSafe,
  isNullOrUndefined,
  splitListValueToArray,
  raiseMisconfiguredRequiredFieldErrorIf,
  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined,
  emptyStringToUndefined,
  parseNumberSafe
} from './utils'

const CURRENCY_ISO_4217_CODES = new Set([
  'USD',
  'AED',
  'AUD',
  'BGN',
  'BRL',
  'CAD',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'CZK',
  'DKK',
  'EGP',
  'EUR',
  'GBP',
  'GIP',
  'HKD',
  'HRK',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'JPY',
  'KRW',
  'KWD',
  'KZT',
  'LBP',
  'MXN',
  'MYR',
  'NGN',
  'NOK',
  'NZD',
  'PEN',
  'PHP',
  'PKR',
  'PLN',
  'QAR',
  'RON',
  'RUB',
  'SAR',
  'SEK',
  'SGD',
  'THB',
  'TRY',
  'TWD',
  'TZS',
  'UAH',
  'VND',
  'ZAR',
  'ALL',
  'BHD',
  'DZD',
  'GHS',
  'IQD',
  'ISK',
  'JOD',
  'KES',
  'MAD',
  'OMR',
  'XOF'
])

const iosAppIDRegex = new RegExp('^[0-9]+$')

const buildAppData = (payload: Payload, settings: Settings) => {
  const app_id = emptyStringToUndefined(settings.app_id)

  // Ideally advertisers on iOS 14.5+ would pass the ATT_STATUS from the device.
  // However the field is required for app events, so hardcode the value to false (0)
  // for any events sent that include app_data.
  const advertiser_tracking_enabled = 0

  const appIDExtInfoVersion = iosAppIDRegex.test((app_id ?? '').trim()) ? 'i2' : 'a2'
  const extInfoVersion = appIDExtInfoVersion

  // extinfo needs to be defined whenever app_data is included in the data payload
  const extinfo = [
    extInfoVersion, // required per spec version must be a2 for Android, must be i2 for iOS
    '',
    '',
    '',
    payload.os_version ?? '', // os version
    payload.device_model ?? '', // device model name
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    ''
  ]

  // Only set app data for app events
  return {
    app_id,
    advertiser_tracking_enabled,
    extinfo
  }
}

const buildUserData = (payload: Payload) => {
  // Removes all leading and trailing whitespace and converts all characters to lowercase.
  const normalizedEmail = payload.email?.replace(/\s/g, '').toLowerCase()
  const email = hashEmailSafe(normalizedEmail)

  // Removes all non-numberic characters and leading zeros.
  const normalizedPhoneNumber = payload.phone_number?.replace(/\D|^0+/g, '')
  const phone_number = hash(normalizedPhoneNumber)

  // Converts all characters to lowercase
  const madid = payload.mobile_ad_id?.toLowerCase()

  const client_ip_address = payload.ip_address
  const client_user_agent = payload.user_agent

  const idfv = payload.idfv

  const sc_click_id = payload.click_id
  const sc_cookie1 = payload.uuid_c1

  return emptyObjectToUndefined({
    client_ip_address,
    client_user_agent,
    em: box(email),
    idfv,
    madid,
    ph: box(phone_number),
    sc_click_id,
    sc_cookie1
  })
}

const buildCustomData = (payload: Payload) => {
  const deprecated_products = (payload.products ?? []).filter(({ item_id }) => item_id != null)

  const content_ids =
    (deprecated_products.length > 0 ? deprecated_products.map(({ item_id }) => item_id ?? '') : undefined) ??
    splitListValueToArray(payload.item_ids ?? '')

  const content_category =
    (deprecated_products.length > 0
      ? deprecated_products.map(({ item_category }) => item_category ?? '')
      : undefined) ?? splitListValueToArray(payload.item_category ?? '')

  const brands =
    (deprecated_products.length > 0 ? deprecated_products.map((product) => product.brand ?? '') : undefined) ??
    payload.brands

  const num_items =
    deprecated_products.length > 0
      ? deprecated_products.length
      : parseNumberSafe(payload.number_items) ?? content_ids?.length

  const currency = emptyStringToUndefined(payload.currency)?.toUpperCase()
  const order_id = emptyStringToUndefined(payload.transaction_id)
  const search_string = emptyStringToUndefined(payload.search_string)
  const sign_up_method = emptyStringToUndefined(payload.sign_up_method)
  const value = payload.price

  return emptyObjectToUndefined({
    brands,
    content_category,
    content_ids,
    currency,
    num_items,
    order_id,
    search_string,
    sign_up_method,
    value
  })
}

const eventConversionTypeToActionSource: { [k in string]?: string } = {
  WEB: 'website',
  MOBILE_APP: 'app',

  // Use the snap event_conversion_type for offline events
  OFFLINE: 'OFFLINE'
}

const buildPayloadData = (payload: Payload, settings: Settings) => {
  // event_conversion_type is a required parameter whose value is enforced as
  // always OFFLINE, WEB, or MOBILE_APP, so in practice action_source will always have a value.
  const action_source = eventConversionTypeToActionSource[payload.event_conversion_type ?? '']

  // Snaps CAPI v3 supports the legacy v2 events so don't bother
  // translating them
  const event_name = payload.event_type
  const event_source_url = payload.page_url
  const event_id = emptyStringToUndefined(payload.client_dedup_id)

  const ISO_8601_event_time = payload.timestamp
  const event_time = ISO_8601_event_time != null ? Date.parse(ISO_8601_event_time) : undefined

  const app_data = action_source === 'app' ? buildAppData(payload, settings) : undefined
  const user_data = buildUserData(payload)
  const custom_data = buildCustomData(payload)

  return {
    integration: 'segment',
    event_id,
    event_name,
    event_source_url,
    event_time,
    user_data,
    custom_data,
    action_source,
    app_data
  }
}

const validateSettingsConfig = (settings: Settings, action_source: string | undefined) => {
  const { snap_app_id, pixel_id } = settings
  const snapAppID = emptyStringToUndefined(snap_app_id)
  const snapPixelID = emptyStringToUndefined(pixel_id)

  raiseMisconfiguredRequiredFieldErrorIf(
    action_source === 'OFFLINE' && isNullOrUndefined(snapPixelID),
    'If event conversion type is "OFFLINE" then Pixel ID must be defined'
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    action_source === 'app' && isNullOrUndefined(snapAppID),
    'If event conversion type is "MOBILE_APP" then Snap App ID must be defined'
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    action_source === 'website' && isNullOrUndefined(snapPixelID),
    `If event conversion type is "WEB" then Pixel ID must be defined`
  )
}

const buildRequestURL = (settings: Settings, action_source: string | undefined, authToken: string) => {
  const { snap_app_id, pixel_id } = settings

  // Some configurations specify both a snapPixelID and a snapAppID. In these cases
  // check the conversion type to ensure that the right id is selected and used.
  const appOrPixelID = emptyStringToUndefined(
    (() => {
      switch (action_source) {
        case 'website':
        case 'OFFLINE':
          return pixel_id
        case 'app':
          return snap_app_id
        default:
          return undefined
      }
    })()
  )

  return `https://tr.snapchat.com/v3/${appOrPixelID}/events?access_token=${authToken}`
}

const validatePayload = (payload: ReturnType<typeof buildPayloadData>) => {
  const {
    action_source,
    event_name,
    event_time,
    custom_data = {} as NonNullable<typeof payload.custom_data>,
    user_data = {} as NonNullable<typeof payload.user_data>
  } = payload

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(
    action_source,
    "The root value is missing the required field 'action_source'."
  )

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(
    event_name,
    "The root value is missing the required field 'event_name'."
  )

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(
    event_time,
    "The root value is missing the required field 'event_time'."
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    !isNullOrUndefined(custom_data.currency) && !CURRENCY_ISO_4217_CODES.has(custom_data.currency),
    `${custom_data.currency} is not a valid currency code.`
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    isNullOrUndefined(user_data.em) &&
      isNullOrUndefined(user_data.ph) &&
      isNullOrUndefined(user_data.madid) &&
      (isNullOrUndefined(user_data.client_ip_address) || isNullOrUndefined(user_data.client_user_agent)),
    `Payload must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields`
  )
}

export const buildSnapCAPIv3Request = (
  payload: Payload,
  settings: Settings,
  auth: ExecuteInput<Payload, Settings>['auth']
): { url: string; json: object } => {
  const payloadData = buildPayloadData(payload, settings)

  validatePayload(payloadData)
  validateSettingsConfig(settings, payloadData.action_source)

  const authToken = emptyStringToUndefined(auth?.accessToken)
  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(authToken, 'Missing valid auth token')

  const url = buildRequestURL(settings, payloadData.action_source, authToken)

  return {
    url,
    json: {
      data: [payloadData]
    }
  }
}
