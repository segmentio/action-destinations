import {
  ErrorCodes,
  IntegrationError,
  PayloadValidationError,
  RequestClient,
  Features,
  StatsContext
} from '@segment/actions-core'
import {
  BaseEventData,
  EventDataType,
  AnyPayload,
  SearchEventData,
  EventTypeKey,
  RequestJSON,
  CustomEventData,
  AddToCartEventData,
  ViewContentEventData,
  InitiateCheckoutEventData,
  PageEventData,
  PurchaseEventData,
  AppendEventDetails,
  AppendValueEventData,
  GeneratedAppData,
  UserData,
  Content,
} from './types'
import {
  API_VERSION,
  CANARY_API_VERSION,
  FLAGON_NAME,
  US_STATE_CODES,
  COUNTRY_CODES,
  CURRENCY_ISO_CODES,
  EventType,
  FEATURE_FLAG_APPEND_VALUE
} from './constants'
import { processHashing } from '../../../lib/hashing-utils'
import type { Settings } from '../generated-types'
import type { Payload as AddToCartPayload } from '../addToCart/generated-types'
import type { Payload as AddToCart2Payload } from '../addToCart2/generated-types'
import type { Payload as CustomPayload } from '../custom/generated-types'
import type { Payload as Custom2Payload } from '../custom2/generated-types'
import type { Payload as InitiateCheckoutPayload } from '../initiateCheckout/generated-types'
import type { Payload as InitiateCheckout2Payload } from '../initiateCheckout2/generated-types'
import type { Payload as PageViewPayload } from '../pageView/generated-types'
import type { Payload as PageView2Payload } from '../pageView2/generated-types'
import type { Payload as PurchasePayload } from '../purchase/generated-types'
import type { Payload as Purchase2Payload } from '../purchase2/generated-types'
import type { Payload as SearchPayload } from '../search/generated-types'
import type { Payload as Search2Payload } from '../search2/generated-types'
import type { Payload as ViewContentPayload } from '../viewContent/generated-types'
import type { Payload as ViewContent2Payload } from '../viewContent2/generated-types'

export function send<P extends AnyPayload, T extends EventDataType>(
  request: RequestClient,
  payload: P,
  settings: Settings,
  getDataFunction: (payload: P, features?: Features, statsContext?: StatsContext) => T,
  eventType: EventTypeKey,
  features?: Features,
  statsContext?: StatsContext
) {
  const { test_event_code } = payload

  const { testEventCode, pixelId } = settings

  validate(payload, eventType)

  const data = getDataFunction(payload, features, statsContext)

  const json: RequestJSON = {
    data: [data],
    ...(test_event_code || testEventCode ? { test_event_code: test_event_code || testEventCode } : {})
  }

  return request(`https://graph.facebook.com/v${getApiVersion(features, statsContext)}/${pixelId}/events`, {
    method: 'POST',
    json
  })
}

export const validate = (payload: AnyPayload, eventType: EventTypeKey) => {
  const { action_source, user_data } = payload

  if (eventType !== EventType.Custom && eventType !== EventType.PageView) {
    const { currency, contents } = payload as
      | AddToCartPayload
      | AddToCart2Payload
      | SearchPayload
      | Search2Payload
      | ViewContentPayload
      | ViewContent2Payload
      | InitiateCheckoutPayload
      | InitiateCheckout2Payload
      | PurchasePayload
      | Purchase2Payload

    if (eventType === EventType.Purchase && !currency) {
      throw new PayloadValidationError('Must include a currency for Purchase events')
    }

    if (currency && typeof currency === 'string' && !CURRENCY_ISO_CODES.has(currency)) {
      throw new IntegrationError(`${currency} is not a valid currency code.`, ErrorCodes.INVALID_CURRENCY_CODE, 400)
    }

    if (contents) {
      validateContents(contents)
    }
  }

  if (!user_data) {
    throw new PayloadValidationError('Must include at least one user data property')
  }

  if (eventType !== EventType.Custom) {
    if (action_source === 'website' && user_data.client_user_agent === undefined) {
      throw new PayloadValidationError('If action source is "Website" then client_user_agent must be defined')
    }
  }
}

export const validateContents = (contents: Content[]) => {
  const valid_delivery_categories = ['in_store', 'curbside', 'home_delivery']

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i]

    if (!item.id) {
      throw new PayloadValidationError(`contents[${i}] must include an 'id' parameter.`)
    }

    if (item.delivery_category && !valid_delivery_categories.includes(item.delivery_category)) {
      throw new PayloadValidationError(
        `contents[${i}].delivery_category must be one of {in_store, home_delivery, curbside}.`
      )
    }
  }
}

export function getBaseEventData(payload: AnyPayload): BaseEventData {
  const {
    event_time,
    action_source,
    event_source_url,
    event_id,
    user_data,
    app_data_field,
    data_processing_options,
    data_processing_options_country,
    data_processing_options_state
  } = payload

  const baseEventData: BaseEventData = {
    event_time,
    ...(event_source_url && { event_source_url }),
    ...(event_id && { event_id }),
    action_source,
    user_data: getUserData(user_data),
    ...(() => {
      const app_data = generateAppData(app_data_field)
      return app_data ? { app_data } : {}
    })(),
    ...(data_processing_options ? { data_processing_options: ['LDU'] } : {}),
    ...(data_processing_options ? { data_processing_options_country: data_processing_options_country || 0 } : {}),
    ...(data_processing_options ? { data_processing_options_state: data_processing_options_state || 0 } : {})
  }

  return baseEventData
}

export function getAddToCartEventData(payload: AddToCartPayload | AddToCart2Payload): AddToCartEventData {
  const baseEventData = getBaseEventData(payload)
  const { custom_data, content_name, currency, value, content_ids, content_type, contents } = payload

  const data: AddToCartEventData = {
    event_name: 'AddToCart',
    ...baseEventData,
    custom_data: {
      ...custom_data,
      currency: currency as string,
      ...(typeof value === 'number' ? { value } : {}),
      ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
      ...(content_name && { content_name }),
      ...(content_type && { content_type }),
      ...(contents && { contents })
    }
  }
  return data
}

export function getCustomEventData(payload: CustomPayload | Custom2Payload, features?: Features, statsContext?: StatsContext): CustomEventData | AppendValueEventData {
  const baseEventData = getBaseEventData(payload)
  const { is_append_event, append_event_details, custom_data, event_name } = payload

  const data: CustomEventData = {
    event_name,
    ...baseEventData,
    custom_data: { ...custom_data }
  }

  if(is_append_event) {
    if(!features?.[FEATURE_FLAG_APPEND_VALUE]) {
      throw new PayloadValidationError('AppendValue is not enabled for this destination. Please contact Segment support so the feature can be enabled for your Segment workspace.')
    }
    if(append_event_details) {
      return convertToAppendValueEventData(data, append_event_details as AppendEventDetails, statsContext)
    }
  }

  return data
}

export function getInitiateCheckoutEventData(
  payload: InitiateCheckoutPayload | InitiateCheckout2Payload
): InitiateCheckoutEventData {
  const baseEventData = getBaseEventData(payload)
  const { custom_data, currency, value, content_ids, content_category, num_items, contents } = payload

  const data: InitiateCheckoutEventData = {
    event_name: 'InitiateCheckout',
    ...baseEventData,
    custom_data: {
      ...custom_data,
      currency: currency as string,
      ...(typeof value === 'number' ? { value } : {}),
      ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
      ...(contents && { contents }),
      ...(typeof num_items === 'number' && { num_items }),
      ...(content_category && { content_category })
    }
  }
  return data
}

export function getPageViewEventData(payload: PageViewPayload | PageView2Payload): PageEventData {
  const baseEventData = getBaseEventData(payload)
  const data: PageEventData = {
    event_name: 'PageView',
    ...baseEventData
  }
  return data
}

export function getPurchaseEventData(payload: PurchasePayload | Purchase2Payload, features?: Features, statsContext?: StatsContext): PurchaseEventData | AppendValueEventData {
  const baseEventData = getBaseEventData(payload)

  const { is_append_event, append_event_details, order_id, predicted_ltv, custom_data, currency, value, content_ids, net_revenue, content_name, content_type, num_items, contents } =
    payload

  const data: PurchaseEventData = {
    event_name: 'Purchase',
    ...baseEventData,
    custom_data: {
      ...custom_data,
      currency,
      value,
      ...(order_id && { order_id }),
      ...(typeof predicted_ltv === 'number' && { predicted_ltv }),
      ...(typeof net_revenue === 'number' && { net_revenue }),
      ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
      ...(content_name && { content_name }),
      ...(content_type && { content_type }),
      ...(contents && { contents }),
      ...(typeof num_items === 'number' && { num_items })
    }
  }

  if(is_append_event) {
    if(!features?.[FEATURE_FLAG_APPEND_VALUE]) {
      throw new PayloadValidationError('AppendValue is not enabled for this destination. Please contact Segment support so the feature can be enabled for your Segment workspace.')
    }
    if(append_event_details) {
      return convertToAppendValueEventData(data, append_event_details as AppendEventDetails, statsContext)
    }
  }

  return data
}

export function getSearchEventData(payload: SearchPayload | Search2Payload): SearchEventData {
  const baseEventData = getBaseEventData(payload)
  const { custom_data, currency, value, content_ids, search_string, content_category, contents } = payload

  const data: SearchEventData = {
    event_name: 'Search',
    ...baseEventData,
    custom_data: {
      ...custom_data,
      currency: currency as string,
      value,
      ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
      ...(contents && { contents }),
      ...(content_category && { content_category }),
      ...(search_string && { search_string })
    }
  }
  return data
}

export function getViewContentEventData(payload: ViewContentPayload | ViewContent2Payload): ViewContentEventData {
  const baseEventData = getBaseEventData(payload)
  const { custom_data, currency, value, content_ids, content_category, content_name, content_type, contents } = payload

  const data: ViewContentEventData = {
    event_name: 'ViewContent',
    ...baseEventData,
    custom_data: {
      ...custom_data,
      currency: currency as string,
      value,
      ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
      ...(content_name && { content_name }),
      ...(content_type && { content_type }),
      ...(contents && { contents }),
      ...(content_category && { content_category })
    }
  }
  return data
}

export const convertToAppendValueEventData = (
  data: CustomEventData | PurchaseEventData,
  append_event_details: AppendEventDetails,
  statsContext?: StatsContext
): AppendValueEventData => {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags

  const {
    event_name,
    custom_data: { order_id: _order_id, net_revenue: _net_revenue, predicted_ltv: _predicted_ltv, ...restCustomData }
  } = data

  const {
    original_event_time,
    original_event_order_id,
    original_event_id,
    net_revenue_to_append,
    predicted_ltv_to_append
  } = append_event_details

  if(!original_event_time) {
    statsClient?.incr('append_value_event.error', 1, tags)
    throw new PayloadValidationError('If sending an AppendValue, Append Event Details field "Original Event Time" is required')
  }

  if(!original_event_order_id && !original_event_id) {
    statsClient?.incr('append_value_event.error', 1, tags)
    throw new PayloadValidationError('If sending an AppendValue, one of "Append Event Details > Original Event ID" or "Append Event Details > Original Order ID" must be provided')
  }

  if(typeof net_revenue_to_append !== 'number' && typeof predicted_ltv_to_append !== 'number') {
    statsClient?.incr('append_value_event.error', 1, tags)
    throw new PayloadValidationError('If sending an AppendValue, at least one of "Append Event Details > Net Revenue" or "Append Event Details > Predicted Lifetime Value" must be provided as a number')
  }

  const appendValueEventData: AppendValueEventData = {
      ...data,
      event_name: 'AppendValue',
      custom_data: {
          ...restCustomData,
          ...(typeof net_revenue_to_append ==='number' ? { net_revenue: net_revenue_to_append } : {}),
          ...(typeof predicted_ltv_to_append ==='number' ? { predicted_ltv: predicted_ltv_to_append } : {})
      },
      original_event_data: {
          event_name,
          event_time: original_event_time,
          ...(original_event_order_id ? {order_id: original_event_order_id} : {}),
          ...(original_event_id ? {event_id: original_event_id} : {})
      }
  }

  statsClient?.incr('append_value_event.success', 1, tags)
  return appendValueEventData
}

export const generateAppData = (app_data: AnyPayload['app_data_field']): GeneratedAppData | undefined => {
  const {
    use_app_data,
    advertiser_tracking_enabled,
    application_tracking_enabled,
    madId,
    version,
    packageName,
    shortVersion,
    longVersion,
    osVersion,
    deviceName,
    locale,
    timezone,
    carrier,
    width,
    height,
    density,
    cpuCores,
    storageSize,
    freeStorage,
    deviceTimezone
  } = app_data || {}

  if (!app_data || !use_app_data) {
    return undefined
  }

  return {
    advertiser_tracking_enabled: advertiser_tracking_enabled ? 1 : 0,
    application_tracking_enabled: application_tracking_enabled ? 1 : 0,
    madid: madId,
    extinfo: [
      version ?? '',
      packageName ?? '',
      shortVersion ?? '',
      longVersion ?? '',
      osVersion ?? '',
      deviceName ?? '',
      locale ?? '',
      timezone ?? '',
      carrier ?? '',
      width ?? '',
      height ?? '',
      density ?? '',
      cpuCores ?? '',
      storageSize ?? '',
      freeStorage ?? '',
      deviceTimezone ?? ''
    ]
  }
}

export const getApiVersion = (features: Features | undefined, statsContext: StatsContext | undefined): string => {
  const statsClient = statsContext?.statsClient
  const tags = statsContext?.tags

  if (features && features[FLAGON_NAME]) {
    tags?.push(`version:${CANARY_API_VERSION}`)
    statsClient?.incr(`fb_api_version`, 1, tags)
    return CANARY_API_VERSION
  }

  tags?.push(`version:${API_VERSION}`)
  statsClient?.incr(`fb_api_version`, 1, tags)
  return API_VERSION
}

export const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)

export const hashArray = (values: string[] | undefined): string[] | undefined => {
  if (!values?.length) {
    return undefined
  }
  const cleaned = (Array.isArray(values) ? values : [values]).map((item) => clean(item)).filter(Boolean)
  const hashed = cleaned.map((item) => hash(item)).filter(Boolean) as string[]
  return hashed.length ? hashed : undefined
}

export const cleanAndHash = (value: string | undefined): string | undefined => {
  return hash(clean(value))
}

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined || !value.length) {
    return undefined
  }
  return processHashing(value, 'sha256', 'hex')
}

export const clean = (value: string | undefined): string | undefined => {
  if (value === undefined || !value.length) {
    return undefined
  }
  return value.replace(/\s/g, '').toLowerCase() || undefined
}

/**
 * Normalization of user data properties according to Facebooks specifications.
 * @param payload
 * @see https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences#hash
 */
const trimIfString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

export const getUserData = (payloadUserData: AnyPayload['user_data']): UserData => {
  const {
    email,
    phone,
    gender,
    dateOfBirth,
    lastName,
    firstName,
    city,
    state,
    zip,
    country,
    externalId,
    client_ip_address,
    client_user_agent,
    fbc,
    fbp,
    subscriptionID,
    leadID,
    anonId,
    madId,
    fbLoginID,
    partner_id,
    partner_name,
    ctwa_clid
  } = payloadUserData ?? {}

  const trimmedClientIpAddress = trimIfString(client_ip_address)
  const trimmedClientUserAgent = trimIfString(client_user_agent)
  const trimmedFbc = trimIfString(fbc)
  const trimmedFbp = trimIfString(fbp)
  const trimmedSubscriptionID = trimIfString(subscriptionID)
  const trimmedAnonId = trimIfString(anonId)
  const trimmedMadId = trimIfString(madId)
  const trimmedPartnerId = trimIfString(partner_id)
  const trimmedPartnerName = trimIfString(partner_name)
  const trimmedCtwaClid = trimIfString(ctwa_clid)

  const em = cleanAndHash(email)

  const ph = (() => {
    if (!phone) {
      return undefined
    }
    if (!isHashedInformation(phone)) {
      // Remove all characters except numbers
      const digits = phone.replace(/\D/g, '')
      return hash(digits)
    }
    return phone
  })()

  const ge = (() => {
    if (!gender) {
      return undefined
    }
    if (isHashedInformation(gender)) {
      return gender
    }
    switch (gender.replace(/\s/g, '').toLowerCase()) {
      case 'male':
      case 'm':
        return cleanAndHash('m')
      case 'female':
      case 'f':
        return cleanAndHash('f')
      default:
        return undefined
    }
  })()

  const db = cleanAndHash(dateOfBirth)

  const ln = cleanAndHash(lastName)

  const fn = cleanAndHash(firstName)

  const ct = cleanAndHash(city)

  const st = (() => {
    const stateCleaned = clean(state)
    return hash(US_STATE_CODES.get(stateCleaned ?? '') ?? (stateCleaned || undefined))
  })()

  const zp = cleanAndHash(zip)

  const countryValue = (() => {
    const cleaned = clean(country)
    return hash(COUNTRY_CODES.get(cleaned ?? '') ?? cleaned)
  })()

  const external_id = hashArray(externalId)

  const userData: UserData = {
    ...(em ? { em } : {}),
    ...(ph ? { ph } : {}),
    ...(ge ? { ge } : {}),
    ...(db ? { db } : {}),
    ...(ln ? { ln } : {}),
    ...(fn ? { fn } : {}),
    ...(ct ? { ct } : {}),
    ...(st ? { st } : {}),
    ...(zp ? { zp } : {}),
    ...(countryValue ? { country: countryValue } : {}),
    ...(external_id ? { external_id } : {}),
    ...(trimmedClientIpAddress ? { client_ip_address: trimmedClientIpAddress } : {}),
    ...(trimmedClientUserAgent ? { client_user_agent: trimmedClientUserAgent } : {}),
    ...(trimmedFbc ? { fbc: trimmedFbc } : {}),
    ...(trimmedFbp ? { fbp: trimmedFbp } : {}),
    ...(trimmedSubscriptionID ? { subscription_id: trimmedSubscriptionID } : {}),
    ...(typeof leadID === 'number' ? { lead_id: leadID } : {}),
    ...(trimmedAnonId ? { anon_id: trimmedAnonId } : {}),
    ...(trimmedMadId ? { madid: trimmedMadId } : {}),
    ...(typeof fbLoginID === 'number' ? { fb_login_id: fbLoginID } : {}),
    ...(trimmedPartnerId ? { partner_id: trimmedPartnerId } : {}),
    ...(trimmedPartnerName ? { partner_name: trimmedPartnerName } : {}),
    ...(trimmedCtwaClid ? { ctwa_clid: trimmedCtwaClid } : {})
  }
  return userData
}
