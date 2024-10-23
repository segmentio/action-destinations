import { JSONLikeObject, ModifiedResponse, MultiStatusResponse, omit } from '@segment/actions-core'
import { IntegrationError, RequestClient, removeUndefined } from '@segment/actions-core'
import dayjs from 'dayjs'
import { Settings } from './generated-types'
import action from './trackPurchase'
import { Payload as TrackEventPayload } from './trackEvent/generated-types'
import { Payload as TrackPurchasePayload } from './trackPurchase/generated-types'
import { Payload as UpdateUserProfilePayload } from './updateUserProfile/generated-types'
import { getUserAlias } from './userAlias'
import { HTTPError } from '@segment/actions-core'
type DateInput = string | Date | number | null | undefined
type DateOutput = string | undefined | null

export type BrazeTrackUserAPIResponse = {
  attributes_processed?: number
  events_processed?: number
  purchases_processed?: number
  message: string
  errors?: {
    type: string
    input_array: 'events' | 'purchases' | 'attributes'
    index: number
  }[]
}

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
      'One of "external_id" or "user_alias" or "braze_id" or "email" is required.',
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

export async function sendBatchedTrackEvent(
  request: RequestClient,
  settings: Settings,
  payloads: TrackEventPayload[],
  syncMode?: 'add' | 'update'
) {
  const multiStatusResponse = new MultiStatusResponse()

  const filteredPayloads: JSONLikeObject[] = []

  // A bitmap that stores arr[new_index] = original_batch_payload_index
  const validPayloadIndicesBitmap: number[] = []

  payloads.forEach((payload, originalBatchIndex) => {
    const { braze_id, external_id, email } = payload
    // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
    const user_alias = getUserAlias(payload.user_alias)

    // Filter out and record if payload is invalid
    if (!braze_id && !user_alias && !external_id && !email) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.'
      })
      return
    }

    let updateExistingOnly = payload._update_existing_only
    if (syncMode) {
      updateExistingOnly = syncMode === 'update'
    }

    const payloadToSend = {
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

    filteredPayloads.push(payloadToSend as JSONLikeObject)

    // Record the index of the original payload in the filtered array
    validPayloadIndicesBitmap.push(originalBatchIndex)

    // Update the original payload with the payload that was sent to Braze
    payloads[originalBatchIndex] = payloadToSend as object as TrackEventPayload

    // Initialize the Multi-Status response to be valid for all validated payloads
    multiStatusResponse.setSuccessResponseAtIndex(originalBatchIndex, {
      status: 200,
      sent: payloadToSend as JSONLikeObject,
      body: 'success'
    })
  })

  const response = request<BrazeTrackUserAPIResponse>(`${settings.endpoint}/users/track`, {
    method: 'post',
    ...(filteredPayloads.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      events: filteredPayloads
    }
  })

  await handleBrazeAPIResponse(
    payloads as object as JSONLikeObject[],
    response,
    multiStatusResponse,
    validPayloadIndicesBitmap
  )

  return multiStatusResponse
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
      'One of "external_id" or "user_alias" or "braze_id" or "email" is required.',
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

export async function sendBatchedTrackPurchase(
  request: RequestClient,
  settings: Settings,
  payloads: TrackPurchasePayload[],
  syncMode?: 'add' | 'update'
) {
  const multiStatusResponse = new MultiStatusResponse()

  const flattenedPayload: JSONLikeObject[] = []

  // A bitmap that stores arr[new_index] = original_batch_payload_index
  const validPayloadIndicesBitmap: number[] = []

  const reservedKeys = Object.keys(action.fields.products.properties ?? {})

  payloads.forEach((payload, originalBatchIndex) => {
    const { braze_id, external_id, email } = payload
    // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
    const user_alias = getUserAlias(payload.user_alias)

    // Filter out and record if payload is invalid
    if (!braze_id && !user_alias && !external_id && !email) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.'
      })
      return
    }

    // Filter if no products are there to send
    if (payload.products.length === 0) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'This event was not sent to Braze because it did not contain any products.'
      })
      return
    }

    let updateExistingOnly = payload._update_existing_only
    if (syncMode) {
      updateExistingOnly = syncMode === 'update'
    }

    const requestBase = {
      braze_id,
      external_id,
      user_alias,
      email,
      app_id: settings.app_id,
      time: toISO8601(payload.time),
      _update_existing_only: updateExistingOnly
    }

    const eventProperties = omit(payload.properties, ['products'])

    // Since each payload can be potentially expanded into multiple payloads,
    // we are grouping them together to keep track of what was sent to Braze
    const flattenedPayloadGroup: JSONLikeObject[] = []

    payload.products.forEach((product) => {
      const flattenedPayloadItem = {
        ...requestBase,
        product_id: product.product_id,
        currency: product.currency ?? 'USD',
        price: product.price,
        quantity: product.quantity,
        properties: {
          ...omit(product, reservedKeys),
          ...eventProperties
        }
      } as JSONLikeObject

      flattenedPayload.push(flattenedPayloadItem)
      flattenedPayloadGroup.push(flattenedPayloadItem)

      // Record the index of the flattened payload with the index of original batch payload
      validPayloadIndicesBitmap.push(originalBatchIndex)

      // Update the original payload with the payload that was sent to Braze
      payloads[originalBatchIndex] = flattenedPayloadGroup as object as TrackPurchasePayload
    })

    // Initialize the Multi-Status response to be valid for all validated payloads
    multiStatusResponse.setSuccessResponseAtIndex(originalBatchIndex, {
      status: 200,
      sent: payload as unknown as JSONLikeObject,
      body: 'success'
    })
  })

  const response = request<BrazeTrackUserAPIResponse>(`${settings.endpoint}/users/track`, {
    method: 'post',
    ...(flattenedPayload.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      purchases: flattenedPayload
    }
  })

  await handleBrazeAPIResponse(
    payloads as object as JSONLikeObject[],
    response,
    multiStatusResponse,
    validPayloadIndicesBitmap
  )

  return multiStatusResponse
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

export async function updateBatchedUserProfile(
  request: RequestClient,
  settings: Settings,
  payloads: UpdateUserProfilePayload[],
  syncMode?: string
) {
  const multiStatusResponse = new MultiStatusResponse()

  const filteredPayloads: JSONLikeObject[] = []
  // A bitmap that stores arr[new_index] = original_batch_payload_index
  const validPayloadIndicesBitmap: number[] = []

  // Since we  merge reserved keys on top of custom_attributes we need to remove them
  // to respect the customers mappings that might resolve `undefined`, without this we'd
  // potentially send a value from `custom_attributes` that conflicts with their mappings.
  const reservedKeys = Object.keys(action.fields)
  // Push additional default keys so they are not added as custom attributes
  reservedKeys.push('firstName', 'lastName', 'avatar')

  payloads.forEach((payload, originalBatchIndex) => {
    const { braze_id, external_id, email } = payload
    // Extract valid user_alias shape. Since it is optional (oneOf braze_id, external_id) we need to only include it if fully formed.
    const user_alias = getUserAlias(payload.user_alias)

    // Filter out and record if payload is invalid
    if (!braze_id && !user_alias && !external_id && !email) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of "external_id" or "user_alias" or "braze_id" or "email" is required.'
      })
      return
    }

    const customAttrs = omit(payload.custom_attributes, reservedKeys)

    let updateExistingOnly = payload._update_existing_only
    if (syncMode) {
      updateExistingOnly = syncMode === 'update'
    }

    const payloadToSend = {
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

    // Push valid payload to filtered array
    filteredPayloads.push(payloadToSend as JSONLikeObject)

    // Record the index of the original payload in the filtered array
    validPayloadIndicesBitmap.push(originalBatchIndex)

    // Update the original payload with the payload that was sent to Braze
    payloads[originalBatchIndex] = payloadToSend as object as TrackEventPayload

    // Initialize the Multi-Status response to be valid for all validated payloads
    multiStatusResponse.setSuccessResponseAtIndex(originalBatchIndex, {
      status: 200,
      sent: payloadToSend as JSONLikeObject,
      body: 'success'
    })
  })

  const response = request<BrazeTrackUserAPIResponse>(`${settings.endpoint}/users/track`, {
    method: 'post',
    ...(filteredPayloads.length > 1 ? { headers: { 'X-Braze-Batch': 'true' } } : undefined),
    json: {
      attributes: filteredPayloads
    }
  })

  await handleBrazeAPIResponse(
    payloads as object as JSONLikeObject[],
    response,
    multiStatusResponse,
    validPayloadIndicesBitmap
  )

  return multiStatusResponse
}

async function handleBrazeAPIResponse(
  payloads: JSONLikeObject[],
  apiResponse: Promise<ModifiedResponse<BrazeTrackUserAPIResponse>>,
  multiStatusResponse: MultiStatusResponse,
  validPayloadIndicesBitmap: number[]
) {
  try {
    const response: ModifiedResponse<BrazeTrackUserAPIResponse> = await apiResponse

    // Responses were assumed to be successful by default
    // If there are errors we need to update the response
    if (response.data.errors && Array.isArray(response.data.errors)) {
      response.data.errors.forEach((error) => {
        // Resolve error's index back to the original payload's index
        const indexInOriginalPayload = validPayloadIndicesBitmap[error.index]

        // Skip if the index is already marked as an error earlier
        // This is to prevent overwriting the error response if the payload is already marked as an error in Track Purchase
        if (multiStatusResponse.isErrorResponseAtIndex(indexInOriginalPayload)) {
          return
        }

        multiStatusResponse.setErrorResponseAtIndex(indexInOriginalPayload, {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: error.type,
          sent: payloads[indexInOriginalPayload],
          body: error.type
        })
      })
    }
  } catch (error) {
    if (error instanceof HTTPError) {
      const errorResponse = error.response as ModifiedResponse<BrazeTrackUserAPIResponse>

      // Iterate over the errors reported by Braze and store them at the original payload index
      const parsedErrors: Set<string>[] = new Array(payloads.length).fill(new Set<string>())

      if (errorResponse.data.errors && Array.isArray(errorResponse.data.errors)) {
        errorResponse.data.errors.forEach((error) => {
          const indexInOriginalPayload = validPayloadIndicesBitmap[error.index]
          parsedErrors[indexInOriginalPayload].add(error.type)
        })
      }

      for (let i = 0; i < multiStatusResponse.length(); i++) {
        // Skip if the index is already marked as an error in pre-validation
        if (multiStatusResponse.isErrorResponseAtIndex(i)) {
          continue
        }

        // Set the error response
        multiStatusResponse.setErrorResponseAtIndex(i, {
          status: error.response.status,
          // errortype will be inferred from the error.response.status,
          errormessage:
            (error?.response as ModifiedResponse<BrazeTrackUserAPIResponse>)?.data?.message ?? error.message,
          sent: payloads[i],
          body: parsedErrors[i].size > 0 ? Array.from(parsedErrors[i]).join(', ') : undefined
        })
      }
    } else {
      // Bubble up the error and let Actions Framework handle it
      throw error
    }
  }
}

export function generateMultiStatusError(batchSize: number, errorMessage: string): MultiStatusResponse {
  const multiStatusResponse = new MultiStatusResponse()

  for (let i = 0; i < batchSize; i++) {
    multiStatusResponse.pushErrorResponse({
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: errorMessage
    })
  }

  return multiStatusResponse
}
