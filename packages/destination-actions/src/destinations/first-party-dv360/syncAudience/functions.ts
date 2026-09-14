import {
  RequestClient,
  MultiStatusResponse,
  ErrorCodes,
  Features,
  JSONLikeObject,
  AudienceMembership,
  RetryableError,
  IntegrationError,
  InvalidAudienceMembershipError
} from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { processHashing } from '../../../lib/hashing-utils'
import { getApiVersion, getEditCustomerMatchMembersEndpoint } from '../functions'
import { CONSENT_STATUS_GRANTED, CONSENT_STATUS_DENIED, CONTACT_INFO, DEVICE_ID } from './constants'
import type { AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  AudienceTarget,
  Consent,
  Member,
  ContactInfo,
  ContactInfoList,
  MobileDeviceIdList,
  EditCustomerMatchMembersRequest,
  EditCustomerMatchMembersResponse,
  HookOutputs
} from './types'

const CONSENT: Consent = {
  adUserData: CONSENT_STATUS_GRANTED,
  adPersonalization: CONSENT_STATUS_GRANTED
}

function clean(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase()
}

// processHashing returns an already hashed value untouched, and recognises a hash in either
// case. Google matches on the string itself, so the digest is lowercased before it is sent.
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
  const { emails, phoneNumbers, zipCodes, firstName, lastName, countryCode } = payload

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

// added_members and removed_members are two independent unions, so a mixed batch is sent
// as a single request. The union only prevents mixing contact info with mobile device IDs
// in the same direction.
export function buildRequestJSON(
  advertiserId: string,
  audienceType: string,
  addedMembers: Member[],
  removedMembers: Member[]
): EditCustomerMatchMembersRequest {
  const isContactInfo = audienceType === CONTACT_INFO

  const contactInfoList = (members: Member[]): ContactInfoList => ({
    contactInfos: members as ContactInfo[],
    consent: CONSENT
  })

  const mobileDeviceIdList = (members: Member[]): MobileDeviceIdList => ({
    mobileDeviceIds: members as string[],
    consent: CONSENT
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

// Resolves the values the whole batch depends on, or the reason they are unusable.
export function resolveTarget(
  payload: Payload,
  audienceSettings?: AudienceSettings,
  hookOutputs?: HookOutputs
): AudienceTarget | { errormessage: string } {
  const audienceId = getAudienceId(payload, hookOutputs)
  const advertiserId = getAdvertiserId(payload, hookOutputs)
  const audienceType = getAudienceType(audienceSettings, hookOutputs)

  const errormessage = validateAudienceDetails(audienceId, advertiserId, audienceType)

  return errormessage
    ? { errormessage }
    : { audienceId: audienceId as string, advertiserId: advertiserId as string, audienceType: audienceType as string }
}

// Checks everything the whole batch depends on, and reports every problem at once rather
// than one per attempt. Returns undefined when there is nothing wrong.
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

// Checks one event against the audience the batch is being sent to. Returns undefined when the
// event can be sent, otherwise the reason it cannot.
export function validatePayload(
  payload: Payload,
  membership: AudienceMembership,
  audienceTarget: AudienceTarget
): { errortype: keyof typeof ErrorCodes; errormessage: string } | undefined {
  const { audienceId, advertiserId, audienceType } = audienceTarget

  if (typeof membership !== 'boolean') {
    return {
      errortype: ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP,
      errormessage: 'Audience membership could not be resolved to a boolean'
    }
  }

  if (isConsentDenied(payload)) {
    return {
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage:
        'Consent denied for ad user data or ad personalization. Display & Video 360 rejects any request containing denied consent, so this event was not sent.'
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

  if (!(isContactInfo ? buildContactInfo(payload) : payload.mobileDeviceIds)) {
    return {
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: isContactInfo
        ? 'No usable contact info identifiers found. This audience requires an email, a phone number, or a complete first name, last name, zip code and country code.'
        : 'No mobile device ID found. This audience requires a mobile device ID.'
    }
  }

  return undefined
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
): Promise<MultiStatusResponse> {
  const msResponse = new MultiStatusResponse()

  const resolved = resolveTarget(payloads[0], audienceSettings, hookOutputs)

  if ('errormessage' in resolved) {
    return failAllPayloads(msResponse, payloads, isBatch, resolved.errormessage)
  }

  const { audienceId, advertiserId, audienceType } = resolved

  // Member index -> payload index, so responses can be written back against the original batch.
  const addIndices: number[] = []
  const removeIndices: number[] = []
  const addedMembers: Member[] = []
  const removedMembers: Member[] = []
  const members: Record<number, Member> = {}

  payloads.forEach((payload, index) => {
    const membership = audienceMemberships?.[index]

    const problem = validatePayload(payload, membership, resolved)

    if (problem) {
      setError(
        msResponse,
        isBatch,
        index,
        400,
        problem.errortype,
        problem.errormessage,
        payload as unknown as JSONLikeObject
      )
      return
    }

    const member = (audienceType === CONTACT_INFO ? buildContactInfo(payload) : payload.mobileDeviceIds) as Member

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

  const json = buildRequestJSON(advertiserId, audienceType, addedMembers, removedMembers)
  const endpoint = getEditCustomerMatchMembersEndpoint(getApiVersion(features, statsContext), audienceId)

  const response = await request<EditCustomerMatchMembersResponse>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    json,
    throwHttpErrors: false
  })

  const body = (response.data ?? {}) as unknown as JSONLikeObject

  if (response.status >= 500 || response.status === 429) {
    // Transient failure. Throwing lets Segment retry the whole batch rather than
    // discarding every event in it.
    statsContext?.statsClient?.incr('syncAudience.retryable_error', sentIndices.length, statsContext?.tags)
    throw new RetryableError(
      `Display & Video 360 returned a ${response.status} response`,
      response.status as 429 | 500 | 502 | 503 | 504
    )
  }

  if (!response.ok) {
    statsContext?.statsClient?.incr('syncAudience.error', sentIndices.length, statsContext?.tags)

    sentIndices.forEach((index) => {
      setError(
        msResponse,
        isBatch,
        index,
        response.status,
        ErrorCodes.BAD_REQUEST,
        response.data?.error?.message ?? 'Display & Video 360 rejected the request',
        members[index] as unknown as JSONLikeObject,
        body
      )
    })

    return msResponse
  }

  statsContext?.statsClient?.incr('syncAudience.success', sentIndices.length, statsContext?.tags)

  sentIndices.forEach((index) => {
    msResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: members[index] as unknown as JSONLikeObject,
      body
    })
  })

  return msResponse
}
