import {
  RequestClient,
  MultiStatusResponse,
  ErrorCodes,
  Features,
  JSONLikeObject,
  AudienceMembership,
  IntegrationError,
  InvalidAudienceMembershipError,
  ModifiedResponse,
  RetryableError
} from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { processHashing } from '../../../lib/hashing-utils'
import { getApiVersion, getEditCustomerMatchMembersEndpoint } from '../functions'
import { CONSENT_STATUS_DENIED, CONTACT_INFO, DEVICE_ID } from './constants'
import type { AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  AudienceTarget,
  Consent,
  ConsentStatus,
  Member,
  ContactInfo,
  ContactInfoList,
  MobileDeviceIdList,
  EditCustomerMatchMembersRequest,
  EditCustomerMatchMembersResponse,
  HookOutputs
} from './types'

function clean(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase()
}

function hash(value: string): string {
  return processHashing(value, 'sha256', 'hex', clean).toLowerCase()
}

export function getAudienceId(payload: Payload, hookOutputs?: HookOutputs): string | undefined {
  return hookOutputs?.retlOnMappingSave?.outputs?.audienceId ?? payload?.external_id
}

export function getAdvertiserId(payload: Payload, hookOutputs?: HookOutputs): string | undefined {
  return hookOutputs?.retlOnMappingSave?.outputs?.advertiserId ?? payload?.advertiser_id
}

export function getAudienceType(audienceSettings?: AudienceSettings, hookOutputs?: HookOutputs): string | undefined {
  return hookOutputs?.retlOnMappingSave?.outputs?.audienceType ?? audienceSettings?.audienceType
}

// Consent belongs to the list rather than to each member. Each field is passed through as the
// event carries it, and left unset when the event does not: Display & Video 360 reads a missing
// field as not specified, which is the truth when the customer has not told us either way.
// Denied never reaches here, since those events are dropped by buildMember.
export function buildConsent(payload: Payload): Consent | undefined {
  const { ad_user_data, ad_personalization } = payload

  const consent: Consent = {
    ...(ad_user_data ? { adUserData: ad_user_data as ConsentStatus } : {}),
    ...(ad_personalization ? { adPersonalization: ad_personalization as ConsentStatus } : {})
  }

  return Object.keys(consent).length > 0 ? consent : undefined
}

export function isConsentDenied(payload: Payload): boolean {
  return payload.ad_user_data === CONSENT_STATUS_DENIED || payload.ad_personalization === CONSENT_STATUS_DENIED
}

// Display & Video 360 takes several emails, phone numbers or zip codes for one person, so these
// fields accept a single value or a comma separated list of them.
export function toList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function buildContactInfo(payload: Payload): ContactInfo | undefined {
  const { emails, phoneNumbers, zipCodes, firstName, lastName, countryCode } = payload.contact_info ?? {}

  const hashedEmails = toList(emails).map(hash)
  const hashedPhoneNumbers = toList(phoneNumbers).map(hash)
  const zipCodeList = toList(zipCodes)

  const contactInfo: ContactInfo = {
    ...(hashedEmails.length > 0 ? { hashedEmails } : {}),
    ...(hashedPhoneNumbers.length > 0 ? { hashedPhoneNumbers } : {}),
    // Google requires zipCodes, hashedFirstName, hashedLastName and countryCode to be sent
    // together. A partial set is rejected by the API, so they are only included when complete.
    ...(zipCodeList.length > 0 && firstName && lastName && countryCode
      ? {
          zipCodes: zipCodeList,
          hashedFirstName: hash(firstName),
          hashedLastName: hash(lastName),
          countryCode
        }
      : {})
  }

  return Object.keys(contactInfo).length > 0 ? contactInfo : undefined
}

export function buildJSON(
  advertiserId: string,
  audienceType: string,
  addedMembers: Member[],
  removedMembers: Member[],
  consent?: Consent
): EditCustomerMatchMembersRequest {
  const isContactInfo = audienceType === CONTACT_INFO

  const contactInfoList = (members: Member[]): ContactInfoList => ({
    contactInfos: members as ContactInfo[],
    ...(consent ? { consent } : {})
  })

  const mobileDeviceIdList = (members: Member[]): MobileDeviceIdList => ({
    mobileDeviceIds: members as string[],
    ...(consent ? { consent } : {})
  })

  return {
    advertiserId,
    ...(addedMembers.length > 0
      ? isContactInfo
        ? { addedContactInfoList: contactInfoList(addedMembers) }
        : { addedMobileDeviceIdList: mobileDeviceIdList(addedMembers) }
      : {}),
    ...(removedMembers.length > 0
      ? isContactInfo
        ? { removedContactInfoList: contactInfoList(removedMembers) }
        : { removedMobileDeviceIdList: mobileDeviceIdList(removedMembers) }
      : {})
  }
}

export function resolveAudienceDetails(
  payload: Payload,
  audienceSettings?: AudienceSettings,
  hookOutputs?: HookOutputs
): { audienceDetails?: AudienceTarget; errormessage?: string } {
  const audienceId = getAudienceId(payload, hookOutputs)
  const advertiserId = getAdvertiserId(payload, hookOutputs)
  const audienceType = getAudienceType(audienceSettings, hookOutputs)

  const errormessage = validateAudienceDetails(audienceId, advertiserId, audienceType)

  return errormessage
    ? { errormessage }
    : {
        audienceDetails: {
          audienceId: audienceId as string,
          advertiserId: advertiserId as string,
          audienceType: audienceType as string
        }
      }
}

export function validateAudienceDetails(
  audienceId?: string,
  advertiserId?: string,
  audienceType?: string
): string | undefined {
  const problems: string[] = []

  if (!audienceId) {
    problems.push('Missing audience ID')
  }

  if (!advertiserId) {
    problems.push('Missing advertiser ID')
  }

  if (!audienceType) {
    problems.push('Missing audience type')
  } else if (![CONTACT_INFO, DEVICE_ID].includes(audienceType)) {
    problems.push(`Unrecognised audience type: ${audienceType}. Must be ${CONTACT_INFO} or ${DEVICE_ID}`)
  }

  return problems.length > 0 ? problems.join('. ') : undefined
}

export function buildMember(
  payload: Payload,
  membership: AudienceMembership,
  audienceTarget: AudienceTarget
): { member?: Member; errortype?: keyof typeof ErrorCodes; errormessage?: string } {
  const { audienceId, advertiserId, audienceType } = audienceTarget

  if (typeof membership !== 'boolean') {
    return {
      errortype: ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP,
      errormessage: 'Audience membership could not be resolved to a boolean'
    }
  }

  // The whole batch is sent to one audience, taken from the first event. An event belonging
  // to a different audience would therefore be added to the first event's audience instead
  // of its own, which for a multi market setup means writing one market's users into another
  // market's advertiser, silently. batch_keys should prevent a mixed batch ever being built,
  // so this is a second line of defence: drop the mismatched event rather than misfile it.
  if (
    (payload.external_id && payload.external_id !== audienceId) ||
    (payload.advertiser_id && payload.advertiser_id !== advertiserId)
  ) {
    return {
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: 'Event does not belong to the same audience and advertiser as the rest of the batch'
    }
  }

  const isContactInfo = audienceType === CONTACT_INFO
  const member = isContactInfo ? buildContactInfo(payload) : payload.mobileDeviceIds

  if (!member) {
    return {
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: isContactInfo
        ? 'No usable contact info identifiers found. This audience requires an email, a phone number, or a complete first name, last name, zip code and country code.'
        : 'No mobile device ID found. This audience requires a mobile device ID.'
    }
  }

  return { member }
}

// Core's RetryableStatusCodes is a type rather than a value, so it cannot be imported. These are
// the transient statuses Display & Video 360 can realistically return.
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500
}

// A 401 is reported as an authentication error so that it reads correctly in the delivery logs.
// Core refreshes the token and retries on a 401 either way: from a MultiStatusResponse entry for
// a batch, and from the status on the thrown error for a single event.
export function errorTypeForStatus(status: number): keyof typeof ErrorCodes {
  if (status === 401) {
    return ErrorCodes.INVALID_AUTHENTICATION
  }

  return isRetryableStatus(status) ? ErrorCodes.RETRYABLE_ERROR : ErrorCodes.BAD_REQUEST
}

// A single event has no MultiStatusResponse to report into, so failures must be thrown
// for Segment to record the event as failed.
function setError(
  msResponse: MultiStatusResponse,
  isBatch: boolean,
  index: number,
  status: number,
  errortype: keyof typeof ErrorCodes,
  errormessage: string,
  sent?: JSONLikeObject,
  body?: JSONLikeObject
) {
  if (!isBatch) {
    if (errortype === ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP) {
      throw new InvalidAudienceMembershipError(errormessage)
    }
    // A single event carries no MultiStatusResponse, so a transient failure has to be thrown as
    // a RetryableError for it to be retried rather than discarded.
    if (isRetryableStatus(status)) {
      throw new RetryableError(errormessage)
    }
    throw new IntegrationError(errormessage, errortype, status)
  }

  msResponse.setErrorResponseAtIndex(index, {
    status,
    errortype,
    errormessage,
    ...(sent ? { sent } : {}),
    ...(body ? { body } : {})
  })
}

// Applies a batch level failure to every payload: an error entry per index for a batch,
// or a thrown error for a single event, which has no MultiStatusResponse to report into.
export function failAllPayloads(
  msResponse: MultiStatusResponse,
  payloads: Payload[],
  isBatch: boolean,
  errormessage: string,
  errortype: keyof typeof ErrorCodes = ErrorCodes.PAYLOAD_VALIDATION_FAILED,
  status = 400
): MultiStatusResponse {
  payloads.forEach((payload, index) => {
    setError(msResponse, isBatch, index, status, errortype, errormessage, payload as unknown as JSONLikeObject)
  })

  return msResponse
}

export async function send(
  request: RequestClient,
  payloads: Payload[],
  isBatch: boolean,
  audienceMemberships: AudienceMembership[] | undefined,
  audienceSettings?: AudienceSettings,
  hookOutputs?: HookOutputs,
  statsContext?: StatsContext,
  features?: Features
): Promise<MultiStatusResponse | ModifiedResponse<EditCustomerMatchMembersResponse>> {
  const msResponse = new MultiStatusResponse()

  const { audienceDetails, errormessage } = resolveAudienceDetails(payloads[0], audienceSettings, hookOutputs)

  if (!audienceDetails) {
    return failAllPayloads(msResponse, payloads, isBatch, errormessage as string)
  }

  const { audienceId, advertiserId, audienceType } = audienceDetails

  // Consent applies to the whole list rather than to each member, and batch_keys pins a batch to
  // one combination of consent values, so the first event speaks for the batch. Display & Video
  // 360 rejects a request containing denied consent, so the batch is failed rather than sent.
  if (isConsentDenied(payloads[0])) {
    return failAllPayloads(
      msResponse,
      payloads,
      isBatch,
      'Consent denied for ad user data or ad personalization. Display & Video 360 rejects any request containing denied consent, so these events were not sent.'
    )
  }

  // Member index -> payload index, so responses can be written back against the original batch.
  const addIndices: number[] = []
  const removeIndices: number[] = []
  const addedMembers: Member[] = []
  const removedMembers: Member[] = []
  const members: Record<number, Member> = {}

  payloads.forEach((payload, index) => {
    const membership = audienceMemberships?.[index]

    const { member, errortype, errormessage } = buildMember(payload, membership, audienceDetails)

    if (!member) {
      setError(
        msResponse,
        isBatch,
        index,
        400,
        errortype as keyof typeof ErrorCodes,
        errormessage as string,
        payload as unknown as JSONLikeObject
      )
      return
    }

    members[index] = member

    if (membership === true) {
      addedMembers.push(member)
      addIndices.push(index)
    } else {
      removedMembers.push(member)
      removeIndices.push(index)
    }
  })

  const sentIndices = [...addIndices, ...removeIndices]

  if (sentIndices.length === 0) {
    statsContext?.statsClient?.incr('syncAudience.discard', payloads.length, statsContext?.tags)
    return msResponse
  }

  // batch_keys pins a batch to one combination of consent values, so every payload carries the
  // same consent and the first one speaks for the batch.
  const consent = buildConsent(payloads[0])

  const json = buildJSON(advertiserId, audienceType, addedMembers, removedMembers, consent)
  const endpoint = getEditCustomerMatchMembersEndpoint(getApiVersion(features, statsContext), audienceId)

  // throwHttpErrors is off so every HTTP response, including a 5xx, is reported per event in the
  // MultiStatusResponse. A network failure still rejects and propagates on its own.
  const response = await request<EditCustomerMatchMembersResponse>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    json,
    throwHttpErrors: false
  })

  if (!response.ok) {
    const { status, data } = response

    statsContext?.statsClient?.incr('syncAudience.error', sentIndices.length, statsContext?.tags)

    sentIndices.forEach((index) => {
      setError(
        msResponse,
        isBatch,
        index,
        status,
        errorTypeForStatus(status),
        data?.error?.message ?? 'Display & Video 360 rejected the request',
        members[index] as unknown as JSONLikeObject,
        (data ?? {}) as unknown as JSONLikeObject
      )
    })

    return msResponse
  }

  statsContext?.statsClient?.incr('syncAudience.success', sentIndices.length, statsContext?.tags)

  if (!isBatch) {
    return response
  }

  sentIndices.forEach((index) => {
    msResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: members[index] as unknown as JSONLikeObject,
      body: { success: true }
    })
  })

  return msResponse
}
