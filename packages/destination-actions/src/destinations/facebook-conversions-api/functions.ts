import {  ErrorCodes, IntegrationError, PayloadValidationError, RequestClient, Features, StatsContext } from '@segment/actions-core'
import { BaseEventData, EventDataType, AnyPayload, SearchEventData, EventTypeKey, RequestJSON, CustomEventData, AddToCartEventData, ViewContentEventData, InitiateCheckoutEventData, PageEventData, PurchaseEventData, AppendValueEventData, GeneratedAppData, UserData, Content } from './types'
import { API_VERSION, CANARY_API_VERSION, FLAGON_NAME, US_STATE_CODES, COUNTRY_CODES, CURRENCY_ISO_CODES } from './constants'
import { processHashing } from '../../lib/hashing-utils'
import type { Settings } from './generated-types'
import type { Payload as AddToCartPayload } from './addToCart/generated-types'
import type { Payload as AddToCart2Payload } from './addToCart2/generated-types'
import type { Payload as CustomPayload } from './custom/generated-types'
import type { Payload as Custom2Payload } from './custom2/generated-types'
import type { Payload as InitiateCheckoutPayload } from './initiateCheckout/generated-types'
import type { Payload as InitiateCheckout2Payload } from './initiateCheckout2/generated-types'
import type { Payload as PageViewPayload } from './pageView/generated-types'
import type { Payload as PageView2Payload } from './pageView2/generated-types'
import type { Payload as PurchasePayload } from './purchase/generated-types'
import type { Payload as Purchase2Payload } from './purchase2/generated-types'
import type { Payload as SearchPayload } from './search/generated-types'
import type { Payload as Search2Payload } from './search2/generated-types'
import type { Payload as ViewContentPayload } from './viewContent/generated-types'
import type { Payload as ViewContent2Payload } from './viewContent2/generated-types'

export function send<T extends EventTypeKey>(request: RequestClient, payload: AnyPayload, settings: Settings, eventType: T, features?: Features, statsContext?: StatsContext) {
  validate(payload, eventType)
  
  const { 
    test_event_code,
  } = payload

  const {
    testEventCode
  } = settings

  const data = getEventData(payload, eventType)

  const json: RequestJSON = {
    data: [data],
    ...(test_event_code || testEventCode ? { test_event_code: test_event_code || testEventCode } : {} )
  }

  return request(
    `https://graph.facebook.com/v${getApiVersion(features, statsContext)}/${settings.pixelId}/events`,
    {
        method: 'POST',
        json
    }
  )
}

export const validate = (payload: AnyPayload, eventType: EventTypeKey) => {
  const { 
    action_source,
    user_data
  } = payload

  if(isPurchaseMatch(payload, eventType) || isCustomMatch(payload, eventType)) {
    const { 
      is_append_event,
      append_event_details: { 
          original_event_order_id,
          original_event_id,
          net_revenue_to_append,
          predicted_ltv_to_append
      } = {}
    } = payload

    if(is_append_event) {
      if(!original_event_order_id && !original_event_id) {
        throw new PayloadValidationError('If append event is true, one of "Append Event Details > Original Event ID" or "Append Event Details > Original Order ID" must be provided.')
      }
      if(typeof net_revenue_to_append !== 'number' && typeof predicted_ltv_to_append !== 'number'){
        throw new PayloadValidationError('If append event is true, at least one of "Append Event Details > Net Revenue" or "Append Event Details > Predicted Lifetime Value" must be provided as a number')
      }
    }
  }

  if(!isPageViewMatch(payload, eventType) && !isCustomMatch(payload, eventType)) {
    const { 
      currency,
      contents
    } = payload

    if (currency && typeof currency === 'string' && !CURRENCY_ISO_CODES.has(currency)) {
      throw new IntegrationError(
        `${currency} is not a valid currency code.`,
        ErrorCodes.INVALID_CURRENCY_CODE,
        400
      )
    }

    if (contents) {
      validateContents(contents) 
    }
  }

  if (!user_data) {
    throw new PayloadValidationError('Must include at least one user data property')
  }

  if(!isCustomMatch(payload, eventType)){
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

export const isAddToCartMatch = (_payload: AnyPayload, type: EventTypeKey): _payload is AddToCartPayload | AddToCart2Payload => {
  return type === 'AddToCart'
}

export const isCustomMatch = (_payload: AnyPayload, type: EventTypeKey): _payload is CustomPayload | Custom2Payload => {
  return type === 'Custom'
}

export const isInitiateCheckoutMatch = (_payload: AnyPayload, type: EventTypeKey): _payload is InitiateCheckoutPayload | InitiateCheckout2Payload => {
  return type === 'InitiateCheckout'
}

export const isPageViewMatch = (_payload: AnyPayload, type: EventTypeKey): _payload is PageViewPayload | PageView2Payload => {
  return type === 'PageView'
}

export const isPurchaseMatch = (_payload: AnyPayload, type: EventTypeKey): _payload is PurchasePayload | Purchase2Payload => {
  return type === 'Purchase'
}

export const isSearchMatch = (_payload: AnyPayload, type: EventTypeKey): _payload is SearchPayload | Search2Payload => {
  return type === 'Search'
}

export const isViewContentMatch = (_payload: AnyPayload, type: EventTypeKey): _payload is ViewContentPayload | ViewContent2Payload => {
  return type === 'ViewContent'
}

export function getEventData(payload: AnyPayload, type: EventTypeKey): EventDataType {
  const { 
    event_time,
    action_source,
    event_source_url,
    event_id,
    user_data,
    custom_data, 
    app_data_field,
    data_processing_options,
    data_processing_options_country,
    data_processing_options_state
  } = payload
  
  const common: BaseEventData = {
    event_time,
    action_source,
    ...(event_source_url && { event_source_url }),
    ...(event_id && { event_id }),
    user_data: getUserData(user_data),
    ...(() => {
        const app_data = generateAppData(app_data_field)
        return app_data ? { app_data }: {}
    })(),
    ...(data_processing_options ? { data_processing_options: ['LDU'] } : {}),
    ...(data_processing_options ? { data_processing_options_country: data_processing_options_country || 0 } : {}  ),
    ...(data_processing_options ? { data_processing_options_state: data_processing_options_state || 0 } : {}  )
  }

  switch(type) {
    case 'AddToCart': {
      if (!isAddToCartMatch(payload, type)) {
        throw new PayloadValidationError('Invalid AddToCart payload')
      }
      const {
        content_name,
        currency,
        value,
        content_ids,
        content_type,
        contents
      } = payload

      const data: AddToCartEventData = {
        event_name: 'AddToCart',
        ...common,
        custom_data: {
          ...custom_data,
          currency: currency as string,
          ...(typeof value ==='number'? { value }: {}),
          ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
          ...(content_name && { content_name }),
          ...(content_type && { content_type }),
          ...(contents && { contents })
        }
      }
      return data
    }
    case 'Custom': {
      if (!isCustomMatch(payload, type)) {
        throw new PayloadValidationError('Invalid Custom payload')
      }
      const { 
        event_name,
        is_append_event
      } = payload

      let data: CustomEventData | AppendValueEventData = {
        event_name,
        ...common,
        custom_data: { ...custom_data }
      }

      if(is_append_event) {
        data = convertToAppendValueEventData(data, payload, type)
      } 
      return data
    }
    case 'InitiateCheckout': {
      if (!isInitiateCheckoutMatch(payload, type)) {
        throw new PayloadValidationError('Invalid InitiateCheckout payload')
      }
      const {
        currency,
        value,
        content_ids,
        content_category,
        num_items,
        contents
      } = payload

      const data: InitiateCheckoutEventData = {
        event_name: 'InitiateCheckout',
        ...common,
        custom_data: {
          ...custom_data,
          currency: currency as string,
          ...(typeof value ==='number'? { value }: {}),
          ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
          ...(contents && { contents }),
          ...(typeof num_items === 'number' && { num_items }),
          ...(content_category && { content_category })
        }
      }
      return data
    }
    case "PageView": {
      if (!isPageViewMatch(payload, type)) {
        throw new PayloadValidationError('Invalid PageView payload')
      }
      const data: PageEventData = {
          event_name: 'PageView',
          ...common
      }
      return data
    }
    case "Purchase": {
      if (!isPurchaseMatch(payload, type)) {
        throw new PayloadValidationError('Invalid Purchase payload')
      }
      const {
        is_append_event,
        currency,
        value,
        content_ids,
        order_id,
        net_revenue,
        predicted_ltv,
        content_name,
        content_type,
        num_items,
        contents
      } = payload

      let data: PurchaseEventData | AppendValueEventData = {
        event_name: 'Purchase',
        ...common,
        custom_data: {
          ...custom_data,
          currency,
          value,
          ...(order_id && { order_id }),
          ...(typeof net_revenue === 'number' && { net_revenue }),
          ...(typeof predicted_ltv === 'number' && { predicted_ltv }),
          ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
          ...(content_name && { content_name }),
          ...(content_type && { content_type }),
          ...(contents && { contents }),
          ...(typeof num_items === 'number' && { num_items })
        }
      }

      if(is_append_event) {
        data = convertToAppendValueEventData(data, payload, type)
      } 
      return data
    }
    case "Search": {
      if (!isSearchMatch(payload, type)) {
        throw new PayloadValidationError('Invalid Search payload')
      }
      const {
        currency,
        value,
        content_ids,
        search_string,
        content_category,
        contents
      } = payload
      
      const data: SearchEventData = {
        event_name: 'Search',
        ...common,
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
    case "ViewContent": {
      if (!isViewContentMatch(payload, type)) {
        throw new PayloadValidationError('Invalid ViewContent payload')
      }
      const {
        currency,
        value,
        content_ids,
        content_category,
        content_name,
        content_type,
        contents
      } = payload

      const data: ViewContentEventData = {
        event_name: 'ViewContent',
        ...common,
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
    default: {
      throw new PayloadValidationError(`Unsupported event type: ${type}`)
    }
  }
}

export const convertToAppendValueEventData =(data: PurchaseEventData | CustomEventData, payload: AnyPayload, type: EventTypeKey): AppendValueEventData => {
    
  if(!isPurchaseMatch(payload, type) && !isCustomMatch(payload, type)) {
    throw new PayloadValidationError('Invalid payload for AppendValue event conversion')
  }

  const {
    is_append_event
  } = payload

  if(!is_append_event) {
    throw new PayloadValidationError('AppendValue details should not be processed')
  }

  const { 
    event_name, 
    custom_data: { 
      order_id, 
      ...restCustomData
    } 
  } = data

  const {
    append_event_details: {
      original_event_time,
      original_event_order_id,
      original_event_id,
      net_revenue_to_append,
      predicted_ltv_to_append
    } = {}
  } = payload

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
          ...(original_event_time ? {event_time: original_event_time} : {}),
          ...(original_event_order_id ? {order_id: original_event_order_id} : {}),
          ...(original_event_id ? {event_id: original_event_id} : {})                 
      }
  }

  return appendValueEventData
}

export const generateAppData = (app_data: AnyPayload['app_data_field']): GeneratedAppData | undefined => {
  if (!app_data || !app_data.use_app_data) {
    return undefined
  }

  return {
    advertiser_tracking_enabled: app_data?.advertiser_tracking_enabled ? 1 : 0,
    application_tracking_enabled: app_data?.application_tracking_enabled ? 1 : 0,
    madid: app_data?.madId,
    extinfo: [
      app_data?.version ?? '',
      app_data?.packageName ?? '',
      app_data?.shortVersion ?? '',
      app_data?.longVersion ?? '',
      app_data?.osVersion ?? '',
      app_data?.deviceName ?? '',
      app_data?.locale ?? '',
      app_data?.timezone ?? '',
      app_data?.carrier ?? '',
      app_data?.width ?? '',
      app_data?.height ?? '',
      app_data?.density ?? '',
      app_data?.cpuCores ?? '',
      app_data?.storageSize ?? '',
      app_data?.freeStorage ?? '',
      app_data?.deviceTimezone ?? ''
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
  const cleaned = (Array.isArray(values) ? values : [values]).map(item => clean(item)).filter(Boolean)
  const hashed = cleaned.map(item => hash(item)).filter(Boolean) as string[]
  return hashed.length ? hashed : undefined
}

export const cleanAndHash = (value: string | undefined): string | undefined => {
  return hash(clean(value))
}

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined || !value.length){
    return undefined
  }
  return processHashing(value, 'sha256', 'hex')
}

export const clean = (value: string | undefined): string | undefined => {
  if (value === undefined || !value.length){
    return undefined
  }
  return value.replace(/\s/g, '').toLowerCase() || undefined
}

/**
 * Normalization of user data properties according to Facebooks specifications.
 * @param payload
 * @see https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences#hash
 */
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
    partner_name
  } = payloadUserData ?? {}

  const em = cleanAndHash(email)

  const ph = (() => {
    if(!phone) {
      return undefined
    }
    if(!isHashedInformation(phone)){
      // Remove all characters except numbers
      const digits = phone.replace(/\D/g, '')
      return hash(digits)
    } 
    return phone
  })()

  const ge = (() => {
    if(isHashedInformation(gender ?? '')) {
      return gender
    }
    switch (gender?.replace(/\s/g, '').toLowerCase() ?? "") {
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
  
  const st = (()=> {
    const stateCleaned = cleanAndHash(state)
    return US_STATE_CODES.get(stateCleaned ?? "") ?? (stateCleaned || undefined)
  })()
  
  const zp = cleanAndHash(zip)
  
  const countryValue = (() => {
    const cleaned = clean(country)
    return COUNTRY_CODES.get(cleaned ?? "") ?? cleaned
  })()

  const external_id = hashArray(externalId)
  
  const userData: UserData = {
    // Hashing this is recommended but not required
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
    ...(client_ip_address ? { client_ip_address } : {}),
    ...(client_user_agent ? { client_user_agent } : {}),
    ...(fbc ? { fbc } : {}),
    ...(fbp ? { fbp } : {}),
    ...(subscriptionID ? { subscription_id: subscriptionID } : {}),
    ...(typeof leadID === 'number' ? { lead_id: leadID } : {}),
    ...(anonId ? { anon_id: anonId } : {}),
    ...(madId ? { madid: madId } : {}),
    ...(typeof fbLoginID === 'number' ? { fb_login_id: fbLoginID } : {}),
    ...(partner_id ? { partner_id } : {}),
    ...(partner_name ? { partner_name } : {})
  }
  return userData
}