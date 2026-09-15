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
  RetryableError,
  isRetryableStatus
} from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import { processHashing } from '../../../lib/hashing-utils'
import { getApiVersion, getEditCustomerMatchMembersEndpoint } from '../functions'
import { AUDIENCE_TYPES, CONSENT_STATUS_GRANTED, CONSENT_STATUS_DENIED, CONTACT_INFO, DEVICE_ID } from './constants'
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

  const { audienceDetails, audienceErrorMessage } = resolveAudienceDetails(payloads[0], audienceSettings, hookOutputs)

  if (!audienceDetails) {
    return failAllPayloads(msResponse, payloads, isBatch, audienceErrorMessage as string)
  }

  const { audienceId, advertiserId, audienceType } = audienceDetails

  const { consent, consentErrorMessage } = buildConsent(payloads[0])

  if (!consent) {
    return failAllPayloads(msResponse, payloads, isBatch, consentErrorMessage as string)
  }

  const addIndices: number[] = []
  const removeIndices: number[] = []
  const addedMembers: Member[] = []
  const removedMembers: Member[] = []
  const membersByIndex: Record<number, Member[]> = {}

  payloads.forEach((payload, index) => {
    const membership = audienceMemberships?.[index]

    const { members, errortype, errormessage } = buildMember(payload, membership, audienceDetails)

    if (!members) {
      setError(msResponse, isBatch, index, 400, errortype as keyof typeof ErrorCodes, errormessage as string)
      return
    }

    membersByIndex[index] = members

    if (membership === true) {
      addedMembers.push(...members)
      addIndices.push(index)
    } else {
      removedMembers.push(...members)
      removeIndices.push(index)
    }
  })

  const sentIndices = [...addIndices, ...removeIndices]

  if (sentIndices.length === 0) {
    return msResponse
  }

  const json = buildJSON(advertiserId, audienceType, addedMembers, removedMembers, consent)
  const endpoint = getEditCustomerMatchMembersEndpoint(getApiVersion(features, statsContext), audienceId)

  const response = await request<EditCustomerMatchMembersResponse>(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    json,
    throwHttpErrors: false
  })

  if (!response.ok) {
    const { status, data } = response

    sentIndices.forEach((index) => {
      setError(
        msResponse,
        isBatch,
        index,
        status,
        errorTypeForStatus(status),
        data?.error?.message ?? 'Display & Video 360 rejected the request',
        membersByIndex[index] as unknown as JSONLikeObject,
        (data ?? {}) as unknown as JSONLikeObject
      )
    })

    return msResponse
  }

  if (!isBatch) {
    return response
  }

  sentIndices.forEach((index) => {
    msResponse.setSuccessResponseAtIndex(index, {
      status: 200,
      sent: membersByIndex[index] as unknown as JSONLikeObject,
      body: { success: true }
    })
  })

  return msResponse
}

function clean(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase()
}

function hash(value: string): string {
  return processHashing(value, 'sha256', 'hex', clean).toLowerCase()
}

export function getAudienceId(payload: Payload, hookOutputs?: HookOutputs): string | undefined {
  return hookOutputs?.retlOnMappingSave?.outputs?.audienceId ?? payload?.external_id
}

export function getAdvertiserId(audienceSettings?: AudienceSettings, hookOutputs?: HookOutputs): string | undefined {
  return hookOutputs?.retlOnMappingSave?.outputs?.advertiserId ?? audienceSettings?.advertiserId
}

export function getAudienceType(audienceSettings?: AudienceSettings, hookOutputs?: HookOutputs): string | undefined {
  return hookOutputs?.retlOnMappingSave?.outputs?.audienceType ?? audienceSettings?.audienceType
}

export function buildConsent(payload: Payload): { consent?: Consent; consentErrorMessage?: string } {
  const { adUserData, adPersonalization } = payload.consent ?? {}

  const unrecognised = [adUserData, adPersonalization].find(
    (value) => value && value !== CONSENT_STATUS_GRANTED && value !== CONSENT_STATUS_DENIED
  )

  if (unrecognised) {
    return {
      consentErrorMessage: `Unrecognised consent value: ${unrecognised}. Must be ${CONSENT_STATUS_GRANTED} or ${CONSENT_STATUS_DENIED}.`
    }
  }

  if (isConsentDenied(payload)) {
    return {
      consentErrorMessage:
        'Consent denied for ad user data or ad personalization. Display & Video 360 rejects any request containing denied consent, so this event was not sent.'
    }
  }

  return {
    consent: {
      ...(adUserData ? { adUserData: adUserData as ConsentStatus } : {}),
      ...(adPersonalization ? { adPersonalization: adPersonalization as ConsentStatus } : {})
    }
  }
}

export function isConsentDenied(payload: Payload): boolean {
  const { adUserData, adPersonalization } = payload.consent ?? {}

  return adUserData === CONSENT_STATUS_DENIED || adPersonalization === CONSENT_STATUS_DENIED
}

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
    // Google requires zipCodes, hashedFirstName, hashedLastName and countryCode to be sent together.
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

  const consentJSON = consent && Object.keys(consent).length > 0 ? { consent } : {}

  const contactInfoList = (members: Member[]): ContactInfoList => ({
    contactInfos: members as ContactInfo[],
    ...consentJSON
  })

  const mobileDeviceIdList = (members: Member[]): MobileDeviceIdList => ({
    mobileDeviceIds: members as string[],
    ...consentJSON
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
): { audienceDetails?: AudienceTarget; audienceErrorMessage?: string } {
  const audienceId = getAudienceId(payload, hookOutputs)
  const advertiserId = getAdvertiserId(audienceSettings, hookOutputs)
  const audienceType = getAudienceType(audienceSettings, hookOutputs)

  const audienceErrorMessage = validateAudienceDetails(audienceId, advertiserId, audienceType, payload?.audience_type)

  return audienceErrorMessage
    ? { audienceErrorMessage }
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
  audienceType?: string,
  mappedAudienceType?: string
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
  } else if (!AUDIENCE_TYPES.includes(audienceType)) {
    problems.push(`Unrecognised audience type: ${audienceType}. Must be ${CONTACT_INFO} or ${DEVICE_ID}`)
  }

  if (mappedAudienceType && audienceType && mappedAudienceType !== audienceType) {
    problems.push(
      `Audience Type is set to ${mappedAudienceType} in this mapping, but the audience in Display & Video 360 is ${audienceType}. Set Audience Type to ${audienceType} so that the mapping shows the identifier fields that audience accepts, or connect this mapping to a ${mappedAudienceType} audience`
    )
  }

  return problems.length > 0 ? problems.join('. ') : undefined
}

export function buildMember(
  payload: Payload,
  membership: AudienceMembership,
  audienceTarget: AudienceTarget
): { members?: Member[]; errortype?: keyof typeof ErrorCodes; errormessage?: string } {
  const { audienceId, audienceType } = audienceTarget

  if (typeof membership !== 'boolean') {
    return {
      errortype: ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP,
      errormessage: 'Audience membership could not be resolved to a boolean'
    }
  }

  if (payload.external_id && payload.external_id !== audienceId) {
    return {
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: 'Event does not belong to the same audience as the rest of the batch'
    }
  }

  const isContactInfo = audienceType === CONTACT_INFO
  const contactInfo = isContactInfo ? buildContactInfo(payload) : undefined
  const members: Member[] = isContactInfo ? (contactInfo ? [contactInfo] : []) : toList(payload.mobileDeviceIds)

  if (members.length === 0) {
    return {
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: isContactInfo
        ? 'No usable contact info identifiers found. This audience requires an email, a phone number, or a complete first name, last name, zip code and country code.'
        : 'No mobile device ID found. This audience requires a mobile device ID.'
    }
  }

  return { members }
}

export function errorTypeForStatus(status: number): keyof typeof ErrorCodes {
  if (status === 401) {
    return ErrorCodes.INVALID_AUTHENTICATION
  }

  return isRetryableStatus(status) ? ErrorCodes.RETRYABLE_ERROR : ErrorCodes.BAD_REQUEST
}

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

    if (isRetryableStatus(status)) {
      throw new RetryableError(errormessage, status)
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

export function failAllPayloads(
  msResponse: MultiStatusResponse,
  payloads: Payload[],
  isBatch: boolean,
  errormessage: string,
  errortype: keyof typeof ErrorCodes = ErrorCodes.PAYLOAD_VALIDATION_FAILED,
  status = 400
): MultiStatusResponse {
  payloads.forEach((_, index) => {
    setError(msResponse, isBatch, index, status, errortype, errormessage)
  })

  return msResponse
}
