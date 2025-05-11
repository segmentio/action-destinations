import {
  APIError,
  RequestClient,
  DynamicFieldResponse,
  IntegrationError,
  PayloadValidationError,
  JSONLikeObject,
  HTTPError,
  MultiStatusResponse,
  ErrorCodes,
  StatsContext
} from '@segment/actions-core'
import { API_URL, REVISION_DATE } from './config'
import { Settings } from './generated-types'
import {
  KlaviyoAPIError,
  ListIdResponse,
  ProfileData,
  listData,
  ImportJobPayload,
  Profile,
  GetProfileResponse,
  SubscribeProfile,
  SubscribeEventData,
  UnsubscribeProfile,
  UnsubscribeEventData,
  GroupedProfiles,
  AdditionalAttributes,
  KlaviyoProfile,
  KlaviyoAPIErrorResponse
} from './types'
import { Payload } from './upsertProfile/generated-types'
import { Payload as RemoveProfilePayload } from './removeProfile/generated-types'
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'
import { Payload as TrackEventPayload } from './trackEvent/generated-types'
import dayjs from '../../lib/dayjs'
import { Payload as AddProfileToListPayload } from './addProfileToList/generated-types'
import { eventBulkCreateRegex } from './properties'
import { ActionDestinationErrorResponseType } from '@segment/actions-core/destination-kittypes'

const phoneUtil = PhoneNumberUtil.getInstance()

export async function getListIdDynamicData(request: RequestClient): Promise<DynamicFieldResponse> {
  try {
    const result: ListIdResponse = await request(`${API_URL}/lists/`, {
      method: 'get'
    })
    const choices = JSON.parse(result.content).data.map((list: { id: string; attributes: { name: string } }) => {
      return { value: list.id, label: list.attributes.name }
    })
    return {
      choices
    }
  } catch (err) {
    return {
      choices: [],
      nextPage: '',
      error: {
        message: (err as APIError).message ?? 'Unknown error',
        code: (err as APIError).status + '' ?? 'Unknown error'
      }
    }
  }
}

export async function addProfileToList(request: RequestClient, id: string, list_id: string | undefined) {
  const listData: listData = {
    data: [
      {
        type: 'profile',
        id: id
      }
    ]
  }
  const list = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
    method: 'POST',
    json: listData
  })
  return list
}

export async function removeProfileFromList(request: RequestClient, ids: string[], list_id: string) {
  const listData: listData = {
    data: ids.map((id) => ({ type: 'profile', id }))
  }

  const response = await request(`${API_URL}/lists/${list_id}/relationships/profiles/`, {
    method: 'DELETE',
    json: listData
  })

  return response
}

export async function createProfile(
  request: RequestClient,
  email: string | undefined,
  external_id: string | undefined,
  phone_number: string | undefined,
  additionalAttributes: AdditionalAttributes
) {
  try {
    const profileData: ProfileData = {
      data: {
        type: 'profile',
        attributes: {
          email,
          external_id,
          phone_number,
          ...additionalAttributes
        }
      }
    }

    const profile = await request(`${API_URL}/profiles/`, {
      method: 'POST',
      json: profileData
    })
    const rs = await profile.json()
    return rs.data.id
  } catch (error) {
    const { response } = error as KlaviyoAPIError
    if (response?.status == 409) {
      const rs = await response.json()
      return rs.errors[0].meta.duplicate_profile_id
    }
  }
}

export function buildHeaders(authKey: string) {
  return {
    Authorization: `Klaviyo-API-Key ${authKey}`,
    Accept: 'application/json',
    revision: REVISION_DATE,
    'Content-Type': 'application/json'
  }
}

export const createImportJobPayload = (profiles: Payload[], listId?: string): { data: ImportJobPayload } => ({
  data: {
    type: 'profile-bulk-import-job',
    attributes: {
      profiles: {
        data: profiles.map(
          ({ list_id, enable_batching, batch_size, override_list_id, country_code, batch_keys, ...attributes }) => ({
            type: 'profile',
            attributes
          })
        )
      }
    },
    ...(listId
      ? {
          relationships: {
            lists: {
              data: [{ type: 'list', id: listId }]
            }
          }
        }
      : {})
  }
})

export const constructBulkProfileImportPayload = (
  profiles: KlaviyoProfile[],
  listId?: string
): { data: ImportJobPayload } => ({
  data: {
    type: 'profile-bulk-import-job',
    attributes: {
      profiles: {
        data: profiles
      }
    },
    ...(listId ? { relationships: { lists: { data: [{ type: 'list', id: listId }] } } } : {})
  }
})
export const sendImportJobRequest = async (request: RequestClient, importJobPayload: { data: ImportJobPayload }) => {
  return await request(`${API_URL}/profile-bulk-import-jobs/`, {
    method: 'POST',
    json: importJobPayload
  })
}

export async function getProfiles(
  request: RequestClient,
  emails: string[] | undefined,
  external_ids: string[] | undefined,
  phoneNumbers: string[] | undefined
): Promise<string[]> {
  const profileIds: string[] = []

  if (external_ids?.length) {
    const filterId = `external_id,["${external_ids.join('","')}"]`
    const response = await request(`${API_URL}/profiles/?filter=any(${filterId})`, {
      method: 'GET'
    })
    const res: GetProfileResponse = await response.json()
    profileIds.push(...res.data.map((profile: Profile) => profile.id))
  }

  if (emails?.length) {
    const filterEmail = `email,["${emails.join('","')}"]`
    const response = await request(`${API_URL}/profiles/?filter=any(${filterEmail})`, {
      method: 'GET'
    })
    const res: GetProfileResponse = await response.json()
    profileIds.push(...res.data.map((profile: Profile) => profile.id))
  }

  if (phoneNumbers?.length) {
    const filterPhone = `phone_number,["${phoneNumbers.join('","')}"]`
    const response = await request(`${API_URL}/profiles/?filter=any(${filterPhone})`, {
      method: 'GET'
    })
    const res: GetProfileResponse = await response.json()
    profileIds.push(...res.data.map((profile: Profile) => profile.id))
  }

  return Array.from(new Set(profileIds))
}

export function formatSubscribeProfile(
  email: string | undefined,
  phone_number: string | undefined,
  consented_at: string | number | undefined
) {
  const profileToSubscribe: SubscribeProfile = {
    type: 'profile',
    attributes: {
      subscriptions: {}
    }
  }

  if (email) {
    profileToSubscribe.attributes.email = email
    profileToSubscribe.attributes.subscriptions.email = {
      marketing: {
        consent: 'SUBSCRIBED'
      }
    }
    if (consented_at) {
      profileToSubscribe.attributes.subscriptions.email.marketing.consented_at = consented_at
    }
  }
  if (phone_number) {
    profileToSubscribe.attributes.phone_number = phone_number
    profileToSubscribe.attributes.subscriptions.sms = {
      marketing: {
        consent: 'SUBSCRIBED'
      }
    }
    if (consented_at) {
      profileToSubscribe.attributes.subscriptions.sms.marketing.consented_at = consented_at
    }
  }

  return profileToSubscribe
}

export function formatSubscribeRequestBody(
  profiles: SubscribeProfile | SubscribeProfile[],
  list_id: string | undefined,
  custom_source: string | undefined
) {
  if (!Array.isArray(profiles)) {
    profiles = [profiles]
  }

  // format request body per klaviyo api spec
  const subData: SubscribeEventData = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        profiles: {
          data: profiles
        }
      }
    }
  }

  subData.data.attributes.custom_source = custom_source || '-59'

  if (list_id) {
    subData.data.relationships = {
      list: {
        data: {
          type: 'list',
          id: list_id
        }
      }
    }
  }

  return subData
}

export function formatUnsubscribeRequestBody(
  profiles: UnsubscribeProfile | UnsubscribeProfile[],
  list_id: string | undefined
) {
  if (!Array.isArray(profiles)) {
    profiles = [profiles]
  }

  // format request body per klaviyo api spec
  const unsubData: UnsubscribeEventData = {
    data: {
      type: 'profile-subscription-bulk-delete-job',
      attributes: {
        profiles: {
          data: profiles
        }
      }
    }
  }

  if (list_id) {
    unsubData.data.relationships = {
      list: {
        data: {
          type: 'list',
          id: list_id
        }
      }
    }
  }

  return unsubData
}

export function formatUnsubscribeProfile(email: string | undefined, phone_number: string | undefined) {
  const profileToUnSubscribe: UnsubscribeProfile = {
    type: 'profile',
    attributes: {
      subscriptions: {}
    }
  }

  if (email) {
    profileToUnSubscribe.attributes.email = email
    profileToUnSubscribe.attributes.subscriptions.email = {
      marketing: {
        consent: 'UNSUBSCRIBED'
      }
    }
  }

  if (phone_number) {
    profileToUnSubscribe.attributes.phone_number = phone_number
    profileToUnSubscribe.attributes.subscriptions.sms = {
      marketing: {
        consent: 'UNSUBSCRIBED'
      },
      transactional: {
        consent: 'UNSUBSCRIBED'
      }
    }
  }
  return profileToUnSubscribe
}

export async function getList(request: RequestClient, settings: Settings, listId: string) {
  const apiKey = settings.api_key
  const response = await request(`${API_URL}/lists/${listId}`, {
    method: 'GET',
    headers: buildHeaders(apiKey),
    throwHttpErrors: false
  })

  if (!response.ok) {
    const errorResponse = await response.json()
    const klaviyoErrorDetail = errorResponse.errors[0].detail
    throw new APIError(klaviyoErrorDetail, response.status)
  }

  const r = await response.json()
  const externalId = r.data.id

  if (externalId !== listId) {
    throw new IntegrationError(
      "Unable to verify ownership over audience. Segment Audience ID doesn't match The Klaviyo List Id.",
      'INVALID_REQUEST_DATA',
      400
    )
  }

  return {
    successMessage: `Using existing list '${r.data.attributes.name}' (id: ${listId})`,
    savedData: {
      id: listId,
      name: r.data.attributes.name
    }
  }
}

export async function createList(request: RequestClient, settings: Settings, listName: string) {
  const apiKey = settings.api_key
  if (!listName) {
    throw new PayloadValidationError('Missing audience name value')
  }

  if (!apiKey) {
    throw new PayloadValidationError('Missing Api Key value')
  }

  const response = await request(`${API_URL}/lists`, {
    method: 'POST',
    headers: buildHeaders(apiKey),
    json: {
      data: { type: 'list', attributes: { name: listName } }
    }
  })
  const r = await response.json()

  return {
    successMessage: `List '${r.data.attributes.name}' (id: ${r.data.id}) created successfully!`,
    savedData: {
      id: r.data.id,
      name: r.data.attributes.name
    }
  }
}

export function groupByListId(profiles: Payload[]) {
  const grouped: GroupedProfiles = {}

  for (const profile of profiles) {
    const listId: string = profile.override_list_id || (profile.list_id as string)
    if (!grouped[listId]) {
      grouped[listId] = []
    }
    grouped[listId].push(profile)
  }

  return grouped
}

export async function processProfilesByGroup(request: RequestClient, groupedProfiles: GroupedProfiles) {
  const importResponses = await Promise.all(
    Object.keys(groupedProfiles).map(async (listId) => {
      const profiles = groupedProfiles[listId]
      const importJobPayload = createImportJobPayload(profiles, listId)
      return await sendImportJobRequest(request, importJobPayload)
    })
  )
  return importResponses
}

export function validateAndConvertPhoneNumber(phone?: string, countryCode?: string): string | undefined | null {
  if (!phone) return

  const e164Regex = /^\+[1-9]\d{1,14}$/

  // Check if the phone number is already in E.164 format
  if (e164Regex.test(phone)) {
    return phone
  }

  // If phone number is not in E.164 format, attempt to convert it using the country code
  if (countryCode) {
    try {
      const parsedPhone = phoneUtil.parse(phone, countryCode)
      const isValid = phoneUtil.isValidNumberForRegion(parsedPhone, countryCode)

      if (!isValid) {
        return null
      }

      return phoneUtil.format(parsedPhone, PhoneNumberFormat.E164)
    } catch (error) {
      return null
    }
  }

  return null
}

export function processPhoneNumber(initialPhoneNumber?: string, country_code?: string): string | undefined {
  if (!initialPhoneNumber) {
    return
  }

  const phone_number = validateAndConvertPhoneNumber(initialPhoneNumber, country_code)
  if (!phone_number) {
    throw new PayloadValidationError(
      `${initialPhoneNumber} is not a valid phone number and cannot be converted to E.164 format.`
    )
  }

  return phone_number
}
/**
 * Updates the multi-status response with error information from Klaviyo for a batch of payloads.
 *
 * This function is designed to handle errors returned by a bulk operation in Klaviyo.
 * It marks the entire batch as failed since granular retries are not supported in bulk operations.
 *
 * @param {JSONLikeObject[]} payloads - An array of payloads that were sent in the bulk operation.
 * @param {any} err - The error object received from the Klaviyo API response.
 * @param {MultiStatusResponse} multiStatusResponse - The object responsible for storing the status of each payload.
 * @param {number[]} validPayloadIndicesBitmap - An array of indices indicating which payloads were valid.
 *
 */
async function updateMultiStatusWithKlaviyoErrors(
  payloads: JSONLikeObject[],
  err: any,
  multiStatusResponse: MultiStatusResponse,
  validPayloadIndicesBitmap: number[]
) {
  const errorResponse = await err?.response?.json()
  payloads.forEach((payload, index) => {
    multiStatusResponse.setErrorResponseAtIndex(validPayloadIndicesBitmap[index], {
      status: err?.response?.status || 400,
      // errortype will be inferred from status
      errormessage: err?.response?.statusText,
      sent: payload,
      body: JSON.stringify(errorResponse)
    })
  })
}

export async function removeBulkProfilesFromList(
  request: RequestClient,
  payloads: RemoveProfilePayload[],
  statsContext?: StatsContext
) {
  const multiStatusResponse = new MultiStatusResponse()

  const { filteredPayloads, validPayloadIndicesBitmap } = validateAndPrepareRemoveBulkProfilePayloads(
    payloads,
    multiStatusResponse
  )
  // if there are no payloads with valid phone number/email/external_id, return multiStatusResponse
  if (!filteredPayloads.length) {
    return multiStatusResponse
  }

  const emails = extractField(filteredPayloads, 'email')
  const externalIds = extractField(filteredPayloads, 'external_id')
  const phoneNumbers = extractField(filteredPayloads, 'phone_number')

  if (statsContext) {
    const { tags, statsClient } = statsContext
    const set = new Set()
    filteredPayloads.forEach((x) => set.add(x.list_id))
    statsClient?.histogram('actions-klaviyo.remove_profile_from_list.unique_list_id', set.size, tags)
  }

  const listId = filteredPayloads[0]?.list_id as string

  try {
    const profileIds = await getProfiles(request, emails, externalIds, phoneNumbers)
    let response = null
    if (profileIds.length) {
      response = await removeProfileFromList(request, profileIds, listId)
    }
    updateMultiStatusWithSuccessData(filteredPayloads, validPayloadIndicesBitmap, multiStatusResponse, response)
  } catch (error) {
    if (error instanceof HTTPError) {
      await updateMultiStatusWithKlaviyoErrors(
        payloads as object as JSONLikeObject[],
        error,
        multiStatusResponse,
        validPayloadIndicesBitmap
      )
    } else {
      throw error // Bubble up the error
    }
  }
  return multiStatusResponse
}

function extractField(payloads: JSONLikeObject[], field: string): string[] {
  return payloads.map((profile) => profile[field]).filter(Boolean) as string[]
}

function validateAndPrepareRemoveBulkProfilePayloads(
  payloads: RemoveProfilePayload[],
  multiStatusResponse: MultiStatusResponse
) {
  const filteredPayloads: JSONLikeObject[] = []
  const validPayloadIndicesBitmap: number[] = []

  payloads.forEach((payload, originalBatchIndex) => {
    const { validPayload, error } = validateAndConstructRemoveProfilePayloads(payload)
    if (error) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, error)
    } else {
      filteredPayloads.push(validPayload as JSONLikeObject)
      validPayloadIndicesBitmap.push(originalBatchIndex)
    }
  })
  return { filteredPayloads, validPayloadIndicesBitmap }
}
function validateAndConstructRemoveProfilePayloads(payload: RemoveProfilePayload): {
  validPayload?: JSONLikeObject
  error?: ActionDestinationErrorResponseType
} {
  const { phone_number, email, external_id } = payload
  const response: { validPayload?: JSONLikeObject; error?: ActionDestinationErrorResponseType } = {}
  if (!email && !phone_number && !external_id) {
    response.error = {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'One of External ID, Phone Number or Email is required.'
    }
    return response
  }

  if (phone_number) {
    const validPhoneNumber = validateAndConvertPhoneNumber(phone_number, payload.country_code as string)
    if (!validPhoneNumber) {
      response.error = {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.'
      }
      return response
    }
    payload.phone_number = validPhoneNumber
  }
  return { validPayload: payload as object as JSONLikeObject }
}

function validateAndConstructProfilePayload(payload: AddProfileToListPayload): {
  validPayload?: JSONLikeObject
  error?: ActionDestinationErrorResponseType
} {
  const { phone_number, email, external_id } = payload
  const response: { validPayload?: JSONLikeObject; error?: ActionDestinationErrorResponseType } = {}
  if (!email && !phone_number && !external_id) {
    response.error = {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'One of External ID, Phone Number or Email is required.'
    }
    return response
  }

  if (phone_number) {
    const validPhoneNumber = validateAndConvertPhoneNumber(phone_number, payload.country_code as string)
    if (!validPhoneNumber) {
      response.error = {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Phone number could not be converted to E.164 format.'
      }
      return response
    }
    payload.phone_number = validPhoneNumber
    delete payload.country_code
  }

  const { list_id, enable_batching, batch_size, country_code, batch_keys, ...attributes } = payload

  response.validPayload = { type: 'profile', attributes: attributes as JSONLikeObject }
  return response
}

function validateAndPrepareBatchedProfileImportPayloads(
  payloads: AddProfileToListPayload[],
  multiStatusResponse: MultiStatusResponse
) {
  const filteredPayloads: JSONLikeObject[] = []
  const validPayloadIndicesBitmap: number[] = []

  payloads.forEach((payload, originalBatchIndex) => {
    const { validPayload, error } = validateAndConstructProfilePayload(payload)
    if (error) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, error)
    } else {
      filteredPayloads.push(validPayload as JSONLikeObject)
      validPayloadIndicesBitmap.push(originalBatchIndex)
    }
  })

  return { filteredPayloads, validPayloadIndicesBitmap }
}

export async function sendBatchedProfileImportJobRequest(
  request: RequestClient,
  payloads: AddProfileToListPayload[],
  statsContext?: StatsContext
) {
  const multiStatusResponse = new MultiStatusResponse()
  const { filteredPayloads, validPayloadIndicesBitmap } = validateAndPrepareBatchedProfileImportPayloads(
    payloads,
    multiStatusResponse
  )

  if (!filteredPayloads.length) {
    return multiStatusResponse
  }

  if (statsContext) {
    const { tags, statsClient } = statsContext
    const set = new Set()
    filteredPayloads.forEach((x) => set.add(x.list_id))
    statsClient?.histogram('actions-klaviyo.add_profile_to_list.unique_list_id', set.size, tags)
  }
  const importJobPayload = constructBulkProfileImportPayload(
    filteredPayloads as unknown as KlaviyoProfile[],
    payloads[0]?.list_id
  )
  try {
    const response = await sendImportJobRequest(request, importJobPayload)
    updateMultiStatusWithSuccessData(filteredPayloads, validPayloadIndicesBitmap, multiStatusResponse, response)
  } catch (error) {
    if (error instanceof HTTPError) {
      await updateMultiStatusWithKlaviyoErrors(
        payloads as object as JSONLikeObject[],
        error,
        multiStatusResponse,
        validPayloadIndicesBitmap
      )
    } else {
      throw error // Bubble up the error
    }
  }
  return multiStatusResponse
}

export async function sendBatchedTrackEvent(request: RequestClient, payloads: TrackEventPayload[]) {
  const multiStatusResponse = new MultiStatusResponse()
  const { filteredPayloads, validPayloadIndicesBitmap } = validateAndPreparePayloads(payloads, multiStatusResponse)
  // if there are no payloads with valid phone number/email/external_id, return multiStatusResponse
  if (!filteredPayloads.length) {
    return multiStatusResponse
  }
  const payloadToSend = {
    data: {
      type: 'event-bulk-create-job',
      attributes: {
        'events-bulk-create': {
          data: filteredPayloads
        }
      }
    }
  }

  try {
    const response = await request(`${API_URL}/event-bulk-create-jobs/`, {
      method: 'POST',
      json: payloadToSend
    })
    updateMultiStatusWithSuccessData(filteredPayloads, validPayloadIndicesBitmap, multiStatusResponse, response)
  } catch (err) {
    if (err instanceof HTTPError) {
      const errorResponse = await err?.response?.json()
      handleKlaviyoAPIErrorResponse(
        payloads as object as JSONLikeObject[],
        errorResponse,
        multiStatusResponse,
        validPayloadIndicesBitmap,
        eventBulkCreateRegex
      )
    } else {
      // Bubble up the error and let Actions Framework handle it
      throw err
    }
  }
  return multiStatusResponse
}

function validateAndPreparePayloads(payloads: TrackEventPayload[], multiStatusResponse: MultiStatusResponse) {
  const filteredPayloads: JSONLikeObject[] = []
  const validPayloadIndicesBitmap: number[] = []

  payloads.forEach((payload, originalBatchIndex) => {
    const { email, phone_number, external_id, anonymous_id, country_code } = payload.profile
    if (!email && !phone_number && !external_id && !anonymous_id) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'One of External ID, Anonymous ID, Phone Number or Email is required.'
      })
      return
    }

    if (phone_number) {
      // Validate and convert the phone number if present
      const validPhoneNumber = validateAndConvertPhoneNumber(phone_number, country_code as string)
      // If the phone number is not valid, skip this payload
      if (!validPhoneNumber) {
        multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Phone number could not be converted to E.164 format.'
        })
        return // Skip this payload
      }

      // Update the payload's phone number with the validated format
      payload.profile.phone_number = validPhoneNumber
      delete payload?.profile?.country_code
    }

    const profileToAdd = constructBulkCreateEventPayload(payload)
    filteredPayloads.push(profileToAdd as JSONLikeObject)
    validPayloadIndicesBitmap.push(originalBatchIndex)
  })

  return { filteredPayloads, validPayloadIndicesBitmap }
}

function constructBulkCreateEventPayload(payload: TrackEventPayload) {
  return {
    type: 'event-bulk-create',
    attributes: {
      profile: {
        data: {
          type: 'profile',
          attributes: payload.profile
        }
      },
      events: {
        data: [
          {
            type: 'event',
            attributes: {
              metric: {
                data: {
                  type: 'metric',
                  attributes: {
                    name: payload.metric_name
                  }
                }
              },
              properties: { ...payload.properties },
              time: payload?.time ? dayjs(payload.time).toISOString() : undefined,
              value: payload.value,
              unique_id: payload.unique_id
            }
          }
        ]
      }
    }
  }
}

/**
 * Handles the error response from the Klaviyo API and updates the status of each payload accordingly.
 * This function processes the `errors` array from the Klaviyo API response, identifies which payloads
 * failed based on their error pointers, and sets an appropriate error response for each payload. If some
 * events in a batch are invalid, it marks the rest as "retryable" if they are part of the same batch.
 *
 * @param {JSONLikeObject[]} payloads - An array of payloads that were sent to the Klaviyo API.
 * @param {KlaviyoAPIErrorResponse} response - The error response from the Klaviyo API.
 * @param {MultiStatusResponse} multiStatusResponse - An object used to store and track the status of each payload.
 * @param {number[]} validPayloadIndicesBitmap - A bitmap of indices representing valid payloads in the `payloads` array.
 * @param {RegExp} regex - A regular expression used to parse the error pointers to find the index of the corresponding payload.
 */

function handleKlaviyoAPIErrorResponse(
  payloads: JSONLikeObject[],
  response: KlaviyoAPIErrorResponse,
  multiStatusResponse: MultiStatusResponse,
  validPayloadIndicesBitmap: number[],
  regex: RegExp
) {
  if (response?.errors && Array.isArray(response.errors)) {
    const invalidIndexSet = new Set<number>()
    response.errors.forEach((error: KlaviyoAPIError) => {
      const indexInOriginalPayload = getIndexFromErrorPointer(error.source.pointer, validPayloadIndicesBitmap, regex)
      if (indexInOriginalPayload !== -1 && !multiStatusResponse.isErrorResponseAtIndex(indexInOriginalPayload)) {
        multiStatusResponse.setErrorResponseAtIndex(indexInOriginalPayload, {
          status: error.status,
          // errortype will be inferred from the error.response.status
          errormessage: error.detail,
          sent: payloads[indexInOriginalPayload],
          body: JSON.stringify(error)
        } as ActionDestinationErrorResponseType)
        invalidIndexSet.add(indexInOriginalPayload)
      }
    })

    for (const index of validPayloadIndicesBitmap) {
      if (!invalidIndexSet.has(index)) {
        multiStatusResponse.setErrorResponseAtIndex(index, {
          errormessage:
            "This event wasn't delivered because of few bad events in the same batch to Klaviyo. This will be retried",
          errortype: 'RETRYABLE_BATCH_FAILURE' as keyof typeof ErrorCodes,
          status: 429,
          sent: payloads[index],
          body: 'Retry'
        })
      }
    }
  }
}

function getIndexFromErrorPointer(pointer: string, validPayloadIndicesBitmap: number[], regex: RegExp) {
  const match = regex.exec(pointer)
  if (match && match[1]) {
    const index = parseInt(match[1], 10)
    return validPayloadIndicesBitmap[index] !== undefined ? validPayloadIndicesBitmap[index] : -1
  }
  return -1
}
/**
 * Updates the multi-status response with success data for each payload.
 * @param {JSONLikeObject[]} filteredPayloads The list of filtered payloads to process.
 * @param {number[]} validPayloadIndicesBitmap A bitmap of valid payload indices.
 * @param {MultiStatusResponse} multiStatusResponse The multi-status response object to update.
 * @param {any} response The response from the import job request containing the data.
 */
export function updateMultiStatusWithSuccessData(
  filteredPayloads: JSONLikeObject[],
  validPayloadIndicesBitmap: number[],
  multiStatusResponse: MultiStatusResponse,
  response: any
) {
  filteredPayloads.forEach((payload, index) => {
    multiStatusResponse.setSuccessResponseAtIndex(validPayloadIndicesBitmap[index], {
      status: 200,
      sent: payload,
      body: JSON.stringify(response?.data) || 'success'
    })
  })
}
