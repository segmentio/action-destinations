import { ExecuteInput, ModifiedResponse, RequestClient } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import {
  box,
  emptyObjectToUndefined,
  emptyToUndefined,
  hash,
  hashEmailSafe,
  isNullOrUndefined,
  splitListValueToArray,
  raiseMisconfiguredRequiredFieldErrorIf,
  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined
} from './utils'
import { CURRENCY_ISO_4217_CODES } from '../snap-capi-properties'

export const validatePayload = (payload: Payload): Payload => {
  raiseMisconfiguredRequiredFieldErrorIf(
    !isNullOrUndefined(payload.currency) && !CURRENCY_ISO_4217_CODES.has(payload.currency.toUpperCase()),
    `${payload.currency} is not a valid currency code.`
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    isNullOrUndefined(payload.email) &&
      isNullOrUndefined(payload.phone_number) &&
      isNullOrUndefined(payload.mobile_ad_id) &&
      (isNullOrUndefined(payload.ip_address) || isNullOrUndefined(payload.user_agent)),
    `Payload must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields`
  )

  return payload
}

const eventConversionTypeToActionSource: { [k in string]?: string } = {
  WEB: 'website',
  MOBILE_APP: 'app'
}

const iosAppIDRegex = new RegExp('^[0-9]+$')

export const formatPayload = (payload: Payload, settings: Settings, isTest = true): object => {
  const action_source = eventConversionTypeToActionSource[payload.event_conversion_type] ?? 'other'

  const event_id = emptyToUndefined(payload.client_dedup_id)

  // Removes all leading and trailing whitespace and converts all characters to lowercase.
  const email = hashEmailSafe(payload.email?.replace(/\s/g, '').toLowerCase())

  // Removes all non-numberic characters and leading zeros.
  const phone_number = hash(payload.phone_number?.replace(/\D|^0+/g, ''))

  // Converts all characters to lowercase
  const madid = payload.mobile_ad_id?.toLowerCase()

  // If customer populates products array, use it instead of the individual fields
  const products = (payload.products ?? []).filter(({ item_id }) => item_id != null)

  const { content_ids, content_category, brands, num_items } =
    products.length > 0
      ? {
          content_ids: products.map(({ item_id }) => item_id),
          content_category: products.map(({ item_category }) => item_category),
          brands: products.map((product) => product.brand ?? ''),
          num_items: products.length
        }
      : {
          content_ids: splitListValueToArray(payload.item_ids ?? ''),
          content_category: splitListValueToArray(payload.item_category ?? ''),
          brands: payload.brands,
          num_items: payload.number_items
        }

  const extInfoVersion = iosAppIDRegex.test((settings.app_id ?? '').trim()) ? 'i2' : 'a2'

  const result = {
    data: [
      {
        integration: 'segment',
        event_id,

        // Snaps CAPI v3 supports the legacy v2 events so don't bother
        // translating them
        event_name: payload.event_type,
        event_source_url: payload.page_url,
        event_time: Date.parse(payload.timestamp),
        user_data: emptyObjectToUndefined({
          client_ip_address: payload.ip_address,
          client_user_agent: payload.user_agent,
          em: box(email),
          madid,

          ph: box(phone_number),
          sc_click_id: payload.click_id,
          sc_cookie1: payload.uuid_c1
        }),
        custom_data: emptyObjectToUndefined({
          brands,
          content_category,
          content_ids,
          currency: payload.currency,
          num_items,
          order_id: emptyToUndefined(payload.transaction_id),
          search_string: payload.search_string,
          sign_up_method: payload.sign_up_method,
          value: payload.price
        }),

        action_source,

        app_data: !isNullOrUndefined(payload.os_version ?? payload.device_model)
          ? {
              extinfo: [
                extInfoVersion, // required per spec version must be a2 for Android, must be i2 for iOS
                '', // app package name
                '', // short version
                '', // long version
                payload.os_version ?? '', // os version
                payload.device_model ?? '', // device model name
                '', // local
                '', // timezone abbr
                '', // carrier
                '', //screen width
                '', // screen height
                '', // screen density
                '', // cpu core
                '', // external storage size
                '', // freespace in external storage size
                '' // device time zone
              ]
            }
          : undefined
      }
    ],
    ...(isTest ? { test_event_code: 'segment_test' } : {})
  }

  return result
}

export const validateAppOrPixelID = (settings: Settings, event_conversion_type: string): string => {
  const { snap_app_id, pixel_id } = settings
  const snapAppID = emptyToUndefined(snap_app_id)
  const snapPixelID = emptyToUndefined(pixel_id)
  const appOrPixelID = snapAppID ?? snapPixelID

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(appOrPixelID, 'Missing valid app or pixel ID')

  raiseMisconfiguredRequiredFieldErrorIf(
    event_conversion_type === 'MOBILE_APP' && isNullOrUndefined(snapAppID),
    'If event conversion type is "MOBILE_APP" then Snap App ID and App ID must be defined'
  )

  raiseMisconfiguredRequiredFieldErrorIf(
    event_conversion_type === 'WEB' && isNullOrUndefined(snapPixelID),
    `If event conversion type is "${event_conversion_type}" then Pixel ID must be defined`
  )

  return appOrPixelID
}

export const buildRequestURL = (appOrPixelID: string, authToken: string) =>
  `https://tr.snapchat.com/v3/${appOrPixelID}/events?access_token=${authToken}`

export const performSnapCAPIv3 = async (
  request: RequestClient,
  data: ExecuteInput<Settings, Payload>,
  isTest = true
): Promise<ModifiedResponse<unknown>> => {
  const { payload, settings } = data
  const { event_conversion_type } = payload
  const authToken = data.auth?.accessToken

  raiseMisconfiguredRequiredFieldErrorIfNullOrUndefined(authToken, 'Missing valid auth token')

  const url = buildRequestURL(validateAppOrPixelID(settings, event_conversion_type), authToken)
  const json = formatPayload(validatePayload(payload), settings, isTest)

  return request(url, {
    method: 'post',
    json
  })
}
