import { omit } from '@segment/actions-core'
import { IntegrationError, RequestClient, removeUndefined } from '@segment/actions-core'
import dayjs from 'dayjs'
import { Settings } from './generated-types'
import action from './trackPurchase'
import { Payload as TrackEventPayload } from './trackEvent/generated-types'
import { Payload as TrackPurchasePayload } from './trackPurchase/generated-types'
import { Payload as UpdateUserProfilePayload } from './updateUserProfile/generated-types'
import { getUserAlias } from './userAlias'
type DateInput = string | Date | number | null | undefined
type DateOutput = string | undefined | null

function toISO8601(date: DateInput): DateOutput {
  if (date === null || date === undefined) {
    return date
  }

  const d = dayjs(date)
  return d.isValid() ? d.toISOString() : undefined
}

function toDateFormat(date: DateInput, format: string): DateOutput {
  if (date === null || date === undefined) {
    return date
  }

  const d = dayjs(date)
  return d.isValid() ? d.format(format) : undefined
}

function removeEmpty(obj: unknown) {
  if (!obj) {
    return obj
  }

  const cleaned = removeUndefined(obj)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (typeof cleaned === 'object' && Object.keys(cleaned!).length > 0) {
    return cleaned
  }

  return undefined
}

function toBrazeGender(gender: string | null | undefined): string | null | undefined {
  if (!gender) {
    return gender
  }

  const genders: Record<string, string[]> = {
    M: ['man', 'male', 'm'],
    F: ['woman', 'female', 'w', 'f'],
    O: ['other', 'o'],
    N: ['not applicable', 'n'],
    P: ['prefer not to say', 'p']
  }

  const brazeGender = Object.keys(genders).find((key) => genders[key].includes(gender.toLowerCase()))
  return brazeGender || gender
}

export function sendTrackEvent(
  request: RequestClient,
  settings: Settings,
  payload: TrackEventPayload,
  syncMode?: 'add' | 'update'
) {
  const { braze_id, external_id, email } = payload
  const user_alias = getUserAlias(payload.user_alias)

  if (!braze_id && !user_alias && !external_id && !email) {
    throw new IntegrationError(
      'One of "external_id" or "user_alias" or "braze_id" is required.',
      'Missing required fields',
      400
    )
  }

  let updateExistingOnly = payload._update_existing_only
  if (syncMode) {
    updateExistingOnly = syncMode === 'update'
  }

  return request(`${settings.endpoint}/users/track`, {
    method: 'post',
    json: {
      events: [
        {
          braze_id,
          external_id,
          email,
          user_alias,
          app_id: settings.app_id,
          name: payload.name,
          time: toISO8601(payload.time),
          properties: payload.properties,
          _update_existing_only: updateExistingOnly
        }
      ]
    }
  })
}

export function sendBatchedTrackEvent(
  request: RequestClient,
  settings: Settings,
  payloads: TrackEventPayload[],
  syncMode?: 'add' | 'update'
) {
  const payload = payloads.map((payload) => {
    const { braze_id, external_id, email } = payload
    // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
    const user_alias = getUserAlias(payload.user_alias)

    // Disable errors until Actions Framework has a multistatus support
    // if (!braze_id && !user_alias && !external_id) {
    //   throw new IntegrationError(
    //     'One of "external_id" or "user_alias" or "braze_id" is required.',
    //     'Missing required fields',
    //     400
    //   )
    // }

    let updateExistingOnly = payload._update_existing_only
    if (syncMode) {
      updateExistingOnly = syncMode === 'update'
    }

    return {
      braze_id,
      external_id,
      email,
      user_alias,
      app_id: settings.app_id,
      name: payload.name,
      time: toISO8601(payload.time),
      properties: payload.properties,
      _update_existing_only: updateExistingOnly
    }
  })

  return request(`${settings.endpoint}/users/track`, {
    method: 'post',
    ...(payload.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      events: payload
    }
  })
}

export function sendTrackPurchase(
  request: RequestClient,
  settings: Settings,
  payload: TrackPurchasePayload,
  syncMode?: 'add' | 'update'
) {
  const { braze_id, external_id, email } = payload
  // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
  const user_alias = getUserAlias(payload.user_alias)

  if (!braze_id && !user_alias && !external_id && !email) {
    throw new IntegrationError(
      'One of "external_id" or "user_alias" or "braze_id" is required.',
      'Missing required fields',
      400
    )
  }

  // Skip when there are no products to send to Braze
  if (payload.products.length === 0) {
    return
  }

  const reservedKeys = Object.keys(action.fields.products.properties ?? {})
  const event_properties = omit(payload.properties, ['products'])

  let updateExistingOnly = payload._update_existing_only
  if (syncMode) {
    updateExistingOnly = syncMode === 'update'
  }

  const base = {
    braze_id,
    external_id,
    email,
    user_alias,
    app_id: settings.app_id,
    time: toISO8601(payload.time),
    _update_existing_only: updateExistingOnly
  }

  return request(`${settings.endpoint}/users/track`, {
    method: 'post',
    ...(payload.products.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      purchases: payload.products.map(function (product) {
        return {
          ...base,
          product_id: product.product_id,
          currency: product.currency ?? 'USD',
          price: product.price,
          quantity: product.quantity,
          properties: {
            ...omit(product, reservedKeys),
            ...event_properties
          }
        }
      })
    }
  })
}

export function sendBatchedTrackPurchase(
  request: RequestClient,
  settings: Settings,
  payloads: TrackPurchasePayload[],
  syncMode?: 'add' | 'update'
) {
  let payload = payloads
    .map((payload) => {
      const { braze_id, external_id, email } = payload
      // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
      const user_alias = getUserAlias(payload.user_alias)

      // Disable errors until Actions Framework has a multistatus support
      // if (!braze_id && !user_alias && !external_id) {
      //   throw new IntegrationError(
      //     'One of "external_id" or "user_alias" or "braze_id" is required.',
      //     'Missing required fields',
      //     400
      //   )
      // }

      // Skip when there are no products to send to Braze
      if (payload.products.length === 0) {
        return
      }

      let updateExistingOnly = payload._update_existing_only
      if (syncMode) {
        updateExistingOnly = syncMode === 'update'
      }

      const base = {
        braze_id,
        external_id,
        user_alias,
        email,
        app_id: settings.app_id,
        time: toISO8601(payload.time),
        _update_existing_only: updateExistingOnly
      }

      const reservedKeys = Object.keys(action.fields.products.properties ?? {})
      const event_properties = omit(payload.properties, ['products'])

      return payload.products.map(function (product) {
        return {
          ...base,
          product_id: product.product_id,
          currency: product.currency ?? 'USD',
          price: product.price,
          quantity: product.quantity,
          properties: {
            ...omit(product, reservedKeys),
            ...event_properties
          }
        }
      })
    })
    .filter((notFalsy) => notFalsy)

  // flatten arrays
  payload = ([] as any[]).concat(...payload)

  return request(`${settings.endpoint}/users/track`, {
    method: 'post',
    ...(payload.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      purchases: payload
    }
  })
}

export function updateUserProfile(
  request: RequestClient,
  settings: Settings,
  payload: UpdateUserProfilePayload,
  syncMode?: string
) {
  const { braze_id, external_id, email } = payload

  // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
  const user_alias = getUserAlias(payload.user_alias)

  if (!braze_id && !user_alias && !external_id && !email) {
    throw new IntegrationError(
      'One of "external_id" or "user_alias" or "braze_id" or "email" is required.',
      'Missing required fields',
      400
    )
  }

  // Since we are merge reserved keys on top of custom_attributes we need to remove them
  // to respect the customers mappings that might resolve `undefined`, without this we'd
  // potentially send a value from `custom_attributes` that conflicts with their mappings.
  const reservedKeys = Object.keys(action.fields)
  // push additional default keys so they are not added as custom attributes
  reservedKeys.push('firstName', 'lastName', 'avatar')
  const customAttrs = omit(payload.custom_attributes, reservedKeys)

  let updateExistingOnly = payload._update_existing_only
  if (syncMode) {
    updateExistingOnly = syncMode === 'update'
  }

  return request(`${settings.endpoint}/users/track`, {
    method: 'post',
    json: {
      attributes: [
        {
          ...customAttrs,
          braze_id,
          external_id,
          user_alias,
          // TODO format country code according to ISO-3166-1 alpha-2 standard?
          // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
          country: payload.country,
          current_location: removeEmpty(payload.current_location),
          date_of_first_session: toISO8601(payload.date_of_first_session),
          date_of_last_session: toISO8601(payload.date_of_last_session),
          dob: toDateFormat(payload.dob, 'YYYY-MM-DD'),
          email: payload.email,
          email_subscribe: payload.email_subscribe,
          email_open_tracking_disabled: payload.email_open_tracking_disabled,
          email_click_tracking_disabled: payload.email_click_tracking_disabled,
          facebook: payload.facebook,
          first_name: payload.first_name,
          gender: toBrazeGender(payload.gender),
          home_city: payload.home_city,
          image_url: payload.image_url,
          // TODO format as ISO-639-1 standard ?
          // https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
          // https://www.braze.com/docs/user_guide/data_and_analytics/user_data_collection/language_codes/
          language: payload.language,
          last_name: payload.last_name,
          marked_email_as_spam_at: toISO8601(payload.marked_email_as_spam_at),
          phone: payload.phone,
          push_subscribe: payload.push_subscribe,
          push_tokens: payload.push_tokens,
          time_zone: payload.time_zone,
          twitter: payload.twitter,
          _update_existing_only: updateExistingOnly
        }
      ]
    }
  })
}

export function updateBatchedUserProfile(
  request: RequestClient,
  settings: Settings,
  payloads: UpdateUserProfilePayload[],
  syncMode?: string
) {
  const payload = payloads.map((payload) => {
    const { braze_id, external_id, email } = payload

    // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
    const user_alias = getUserAlias(payload.user_alias)

    // Disable errors until Actions Framework has a multistatus support
    // if (!braze_id && !user_alias && !external_id) {
    //   throw new IntegrationError(
    //     'One of "external_id" or "user_alias" or "braze_id" is required.',
    //     'Missing required fields',
    //     400
    //   )
    // }

    // Since we are merge reserved keys on top of custom_attributes we need to remove them
    // to respect the customers mappings that might resolve `undefined`, without this we'd
    // potentially send a value from `custom_attributes` that conflicts with their mappings.
    const reservedKeys = Object.keys(action.fields)
    // push additional default keys so they are not added as custom attributes
    reservedKeys.push('firstName', 'lastName', 'avatar')
    const customAttrs = omit(payload.custom_attributes, reservedKeys)

    let updateExistingOnly = payload._update_existing_only
    if (syncMode) {
      updateExistingOnly = syncMode === 'update'
    }

    return {
      ...customAttrs,
      braze_id,
      external_id,
      user_alias,
      // TODO format country code according to ISO-3166-1 alpha-2 standard?
      // https://en.wikipedia.org/wiki/ISO_3166-1_alpha-2
      country: payload.country,
      current_location: removeEmpty(payload.current_location),
      date_of_first_session: toISO8601(payload.date_of_first_session),
      date_of_last_session: toISO8601(payload.date_of_last_session),
      dob: toDateFormat(payload.dob, 'YYYY-MM-DD'),
      email,
      email_subscribe: payload.email_subscribe,
      email_open_tracking_disabled: payload.email_open_tracking_disabled,
      email_click_tracking_disabled: payload.email_click_tracking_disabled,
      facebook: payload.facebook,
      first_name: payload.first_name,
      gender: toBrazeGender(payload.gender),
      home_city: payload.home_city,
      image_url: payload.image_url,
      // TODO format as ISO-639-1 standard ?
      // https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
      // https://www.braze.com/docs/user_guide/data_and_analytics/user_data_collection/language_codes/
      language: payload.language,
      last_name: payload.last_name,
      marked_email_as_spam_at: toISO8601(payload.marked_email_as_spam_at),
      phone: payload.phone,
      push_subscribe: payload.push_subscribe,
      push_tokens: payload.push_tokens,
      time_zone: payload.time_zone,
      twitter: payload.twitter,
      _update_existing_only: updateExistingOnly
    }
  })

  return request(`${settings.endpoint}/users/track`, {
    method: 'post',
    ...(payload.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      attributes: payload
    }
  })
}
