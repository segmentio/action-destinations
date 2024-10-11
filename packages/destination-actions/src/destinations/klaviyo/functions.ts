import {
  APIError,
  RequestClient,
  DynamicFieldResponse,
  IntegrationError,
  PayloadValidationError,
  MultiStatusResponse
} from '@segment/actions-core'
import { JSONLikeObject } from '@segment/actions-core'
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
  KlaviyoAPIErrorResponse
} from './types'
import { Payload } from './upsertProfile/generated-types'
import { Payload as TrackEventPayload } from './trackEvent/generated-types'
import dayjs from 'dayjs'
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'
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
        data: profiles.map(({ list_id, enable_batching, batch_size, override_list_id, ...attributes }) => ({
          type: 'profile',
          attributes
        }))
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

export const sendImportJobRequest = async (request: RequestClient, importJobPayload: { data: ImportJobPayload }) => {
  return await request(`${API_URL}/profile-bulk-import-jobs/`, {
    method: 'POST',
    headers: {
      revision: '2023-10-15.pre'
    },
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
  const profileToSubscribe: UnsubscribeProfile = {
    type: 'profile',
    attributes: {}
  }

  if (email) {
    profileToSubscribe.attributes.email = email
  }

  if (phone_number) {
    profileToSubscribe.attributes.phone_number = phone_number
  }
  return profileToSubscribe
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

export function validatePhoneNumber(phone?: string): boolean {
  if (!phone) return true
  const e164Regex = /^\+[1-9]\d{1,14}$/
  return e164Regex.test(phone)
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

export async function sendBatchedTrackEvent(request: RequestClient, payloads: TrackEventPayload[]) {
  const multiStatusResponse = new MultiStatusResponse()
  const { filteredPayloads, validPayloadIndicesBitmap } = validateAndPreparePayloads(payloads, multiStatusResponse)
  // if there are no payloads with valid phone number/email/external_id, return multiStatusResponse
  if (filteredPayloads.length) {
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
      await request(`${API_URL}/event-bulk-create-jobs/`, {
        method: 'POST',
        json: payloadToSend
      })
    } catch (err: any) {
      await handleKlaviyoAPIErrorResponse(
        transformPayloadsType(payloads),
        await err?.response?.json(),
        multiStatusResponse,
        validPayloadIndicesBitmap
      )
    }
  }

  return multiStatusResponse
}

function validateAndPreparePayloads(payloads: TrackEventPayload[], multiStatusResponse: MultiStatusResponse) {
  const filteredPayloads: JSONLikeObject[] = []
  const validPayloadIndicesBitmap: number[] = []

  payloads.forEach((payload, originalBatchIndex) => {
    const { country_code, phone_number: initialPhoneNumber } = payload.profile

    if (initialPhoneNumber) {
      // Validate and convert the phone number if present
      const validPhoneNumber = validateAndConvertPhoneNumber(initialPhoneNumber, country_code as string)
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

    // Filter out and record if payload is invalid
    const validationError: ActionDestinationErrorResponseType | null = validatePayload(payload)
    if (validationError) {
      multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, validationError)
      return
    }

    // if (!email && !phone_number && !external_id && !anonymous_id) {
    //   multiStatusResponse.setErrorResponseAtIndex(originalBatchIndex, {
    //     status: 400,
    //     errortype: 'PAYLOAD_VALIDATION_FAILED',
    //     errormessage: 'One of External ID, Anonymous ID, Phone Number or Email is required.'
    //   })
    //   return
    // }

    const profileToAdd = constructProfilePayload(payload)
    filteredPayloads.push(profileToAdd as JSONLikeObject)
    validPayloadIndicesBitmap.push(originalBatchIndex)
    multiStatusResponse.setSuccessResponseAtIndex(originalBatchIndex, {
      status: 200,
      sent: profileToAdd as JSONLikeObject,
      body: 'success'
    })
  })

  return { filteredPayloads, validPayloadIndicesBitmap }
}

function constructProfilePayload(payload: TrackEventPayload) {
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

async function handleKlaviyoAPIErrorResponse(
  payloads: JSONLikeObject[],
  response: KlaviyoAPIErrorResponse,
  multiStatusResponse: MultiStatusResponse,
  validPayloadIndicesBitmap: number[]
) {
  if (response?.errors && Array.isArray(response.errors)) {
    const invalidIndexSet = new Set<number>()
    response.errors.forEach((error: KlaviyoAPIError) => {
      const indexInOriginalPayload = getIndexFromErrorPointer(error.source.pointer, validPayloadIndicesBitmap)
      if (indexInOriginalPayload !== -1 && !multiStatusResponse.isErrorResponseAtIndex(indexInOriginalPayload)) {
        multiStatusResponse.setErrorResponseAtIndex(indexInOriginalPayload, {
          status: error.status,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: error.detail,
          sent: payloads[indexInOriginalPayload],
          body: JSON.stringify(error)
        })
        invalidIndexSet.add(indexInOriginalPayload)
      }
    })

    for (const index of validPayloadIndicesBitmap) {
      if (!invalidIndexSet.has(index)) {
        multiStatusResponse.setSuccessResponseAtIndex(index, {
          status: 429,
          sent: payloads[index],
          body: 'Retry'
        })
      }
    }
  }
}

function getIndexFromErrorPointer(pointer: string, validPayloadIndicesBitmap: number[]) {
  const match = /\/data\/attributes\/events-bulk-create\/data\/(\d+)/.exec(pointer)
  if (match && match[1]) {
    const index = parseInt(match[1], 10)
    return validPayloadIndicesBitmap[index] !== undefined ? validPayloadIndicesBitmap[index] : -1
  }
  return -1
}

function transformPayloadsType(obj: object[]) {
  return obj as JSONLikeObject[]
}

function validatePayload(payload: TrackEventPayload): ActionDestinationErrorResponseType | null {
  const { email, phone_number, external_id, anonymous_id } = payload.profile

  if (!email && !phone_number && !external_id && !anonymous_id) {
    return {
      status: 400,
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errormessage: 'One of External ID, Anonymous ID, Phone Number or Email is required.'
    }
  }
  return null
}
