import {  ErrorCodes, IntegrationError, PayloadValidationError, RequestClient, Features, StatsContext } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { RequestJSON, PurchaseEventData, AppendValueEventData, GeneratedAppData, UserData, Content } from './types'
import { API_VERSION, CANARY_API_VERSION, FLAGON_NAME, US_STATE_CODES, COUNTRY_CODES, CURRENCY_ISO_CODES } from '../constants'
import { processHashing } from '../../../lib/hashing-utils'

export function send(request: RequestClient, payload: Payload, settings: Settings, features?: Features, statsContext?: StatsContext) {
    
    const { 
        is_append_event,
        append_event_details: { 
            original_event_time,
            original_event_order_id,
            original_event_id,
            net_revenue_to_append,
            predicted_ltv_to_append
        } = {},
        currency,
        event_time,
        action_source,
        event_source_url,
        event_id,
        order_id,
        user_data,
        custom_data, 
        value,
        net_revenue, 
        predicted_ltv,
        content_ids, 
        content_name, 
        content_type, 
        contents, 
        num_items,
        app_data_field,
        test_event_code,
        data_processing_options,
        data_processing_options_country,
        data_processing_options_state
    } = payload
    
    if(
        is_append_event && 
        (!original_event_time || !original_event_order_id || !original_event_id) 
        && (typeof net_revenue_to_append !== 'number' && typeof predicted_ltv_to_append !== 'number')
    ) {
        throw new PayloadValidationError('If append event is true, original event time, original event order ID, original event ID, and at least one of net revenue to append or predicted lifetime value to append must be provided')
    }

    if (!CURRENCY_ISO_CODES.has(currency)) {
        throw new IntegrationError(
            `${payload.currency} is not a valid currency code.`,
            ErrorCodes.INVALID_CURRENCY_CODE,
            400
        )
    }

    if (!user_data) {
        throw new PayloadValidationError('Must include at least one user data property')
    }

    if (action_source === 'website' && user_data.client_user_agent === undefined) {
        throw new PayloadValidationError('If action source is "Website" then client_user_agent must be defined')
    }

    if (contents) {
        const err = validateContents(contents)
        if (err) throw err
    }

    const testEventCode = test_event_code || settings.testEventCode

    const purchaseEventData =(): PurchaseEventData => {
        return {
            event_name: 'Purchase',
            event_time,
            action_source,
            ...(event_source_url && { event_source_url }),
            ...(event_id && { event_id }),
            user_data: getUserData(user_data),
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
            },
            ...(() => {
                const app_data = generateAppData(app_data_field)
                return app_data ? { app_data }: {}
            })(),
            ...(data_processing_options ? { data_processing_options: ['LDU'] } : {}),
            ...(data_processing_options ? { data_processing_options_country: data_processing_options_country || 0 } : {}  ),
            ...(data_processing_options ? { data_processing_options_state: data_processing_options_state || 0 } : {}  )
        }
    }

    const appendValueEventData =(): AppendValueEventData => {
        const data = purchaseEventData()
        const { order_id, ...customDataWithoutOrderId } = data.custom_data;
        return {
            ...data,
            event_name: 'AppendValue',
            custom_data: {
                ...customDataWithoutOrderId,
                net_revenue: net_revenue_to_append,
                predicted_ltv: predicted_ltv_to_append
            },
            original_event_data: {
                event_name: 'Purchase',
                event_time: original_event_time as string,
                order_id: original_event_order_id,
                event_id: original_event_id                 
            }
        }
    }

    const json: RequestJSON = {
        data: [is_append_event ? appendValueEventData() : purchaseEventData()],
        ...(testEventCode && { test_event_code: testEventCode })
    }

    return request(
        `https://graph.facebook.com/v${getApiVersion(features, statsContext)}/${settings.pixelId}/events`,
        {
            method: 'POST',
            json
        }
    )
}

export const generateAppData = (app_data: Payload['app_data_field']): GeneratedAppData | undefined => {
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
export const getUserData = (payloadUserData: Payload['user_data']): UserData => {
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

export const validateContents = (contents: Content[]): PayloadValidationError | false => {
  const valid_delivery_categories = ['in_store', 'curbside', 'home_delivery']

  for (let i = 0; i < contents.length; i++) {
    const item = contents[i]

    if (!item.id) {
      return new PayloadValidationError(`contents[${i}] must include an 'id' parameter.`)
    }

    if (item.delivery_category && !valid_delivery_categories.includes(item.delivery_category)) {
      return new PayloadValidationError(
        `contents[${i}].delivery_category must be one of {in_store, home_delivery, curbside}.`
      )
    }
  }

  return false
}