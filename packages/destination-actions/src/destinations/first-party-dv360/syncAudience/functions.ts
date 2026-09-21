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
import { PhoneNumberUtil, PhoneNumberFormat } from 'google-libphonenumber'
import { isAlreadyHashed, processHashing } from '../../../lib/hashing-utils'
import { getApiVersion, getEditCustomerMatchMembersEndpoint } from '../functions'
import {
  AUDIENCE_TYPE_LABEL,
  CONSENT_STATUS_GRANTED,
  CONSENT_STATUS_DENIED,
  CONTACT_INFO,
  DEVICE_ID,
  PHONE_NORMALIZATION_NONE,
  PHONE_NORMALIZATION_VALIDATE,
  RETL_HOOK_LABEL
} from './constants'
import type { AudienceSettings } from '../generated-types'
import type { Payload } from './generated-types'
import {
  AudienceTarget,
  ResolvedAudience,
  Consent,
  ConsentStatus,
  Member,
  ContactInfo,
  ContactInfoList,
  CountryCode,
  PhoneOptions,
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
    return failAllPayloads(msResponse, payloads, isBatch, audienceErrorMessage)
  }

  const { audienceId, advertiserId, audienceType } = audienceDetails

  const { consent, consentErrorMessage } = buildConsent(payloads[0].consent)

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

  // Adds and removes cannot travel in the same request, so each direction is sent on its own and
  // reports back only against the payloads it carried.
  const operations = [
    { indices: addIndices, members: addedMembers, isAdd: true },
    { indices: removeIndices, members: removedMembers, isAdd: false }
  ].filter(({ indices }) => indices.length > 0)

  if (operations.length === 0) {
    return msResponse
  }

  const endpoint = getEditCustomerMatchMembersEndpoint(getApiVersion(features, statsContext), audienceId)

  for (const { indices, members, isAdd } of operations) {
    // The request as it would have been had it carried this event alone, so that what is reported
    // against an event is the shape which was really sent, down to which list it travelled in.
    const sentFor = (index: number) =>
      buildJSON(advertiserId, audienceType, membersByIndex[index], isAdd, consent) as unknown as JSONLikeObject

    let response: ModifiedResponse<EditCustomerMatchMembersResponse>

    try {
      response = await request<EditCustomerMatchMembersResponse>(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        json: buildJSON(advertiserId, audienceType, members, isAdd, consent),
        throwHttpErrors: false
      })
    } catch (error) {
      // A transport failure answers with no status, so only the payloads this request carried are
      // failed - anything already recorded for the other direction survives.
      indices.forEach((index) => {
        setError(
          msResponse,
          isBatch,
          index,
          500,
          ErrorCodes.RETRYABLE_ERROR,
          (error as Error)?.message ?? 'Request to Display & Video 360 failed',
          sentFor(index)
        )
      })

      continue
    }

    if (!response.ok) {
      const { status, data } = response

      indices.forEach((index) => {
        setError(
          msResponse,
          isBatch,
          index,
          status,
          errorTypeForStatus(status),
          data?.error?.message ?? 'Display & Video 360 rejected the request',
          sentFor(index),
          (data ?? {}) as unknown as JSONLikeObject
        )
      })

      continue
    }

    if (!isBatch) {
      return response
    }

    // Display & Video 360 answers with nothing but the audience id, so the whole response is
    // reported rather than a stand in for it.
    const body = (response.data ?? {}) as unknown as JSONLikeObject

    indices.forEach((index) => {
      msResponse.setSuccessResponseAtIndex(index, {
        status: response.status,
        sent: sentFor(index),
        body
      })
    })
  }

  return msResponse
}

function isPresent(value: string | undefined): value is string {
  return value !== undefined
}

function stripSpaces(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase()
}

function trimOnly(value: string): string {
  return value.trim()
}

function trimAndLower(value: string): string {
  return value.trim().toLowerCase()
}

function hash(value: string, normalise?: (value: string) => string): string {
  return processHashing(value, 'sha256', 'hex', normalise).toLowerCase()
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

export function buildConsent(mappedConsent: Payload['consent']): {
  consent?: Consent
  consentErrorMessage?: string
} {
  const { adUserData, adPersonalization } = mappedConsent ?? {}

  const unrecognised = [adUserData, adPersonalization].find(
    (value) => value && value !== CONSENT_STATUS_GRANTED && value !== CONSENT_STATUS_DENIED
  )

  if (unrecognised) {
    return {
      consentErrorMessage: `Unrecognised consent value: ${unrecognised}. Must be ${CONSENT_STATUS_GRANTED} or ${CONSENT_STATUS_DENIED}.`
    }
  }

  if (isConsentDenied(mappedConsent)) {
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

export function isConsentDenied(mappedConsent: Payload['consent']): boolean {
  const { adUserData, adPersonalization } = mappedConsent ?? {}

  return adUserData === CONSENT_STATUS_DENIED || adPersonalization === CONSENT_STATUS_DENIED
}

// Email validation - this catches the values worth catching: no @, no domain,
// no dot, or whitespace inside.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isHashed(value: string): boolean {
  return isAlreadyHashed(value, 'sha256', 'hex')
}

export function normaliseEmail(value: string): string | undefined {
  if (isHashed(value)) {
    return value
  }

  const email = value.trim().toLowerCase()

  return EMAIL_PATTERN.test(email) ? email : undefined
}

const phoneUtil = PhoneNumberUtil.getInstance()

// Display & Video 360 only matches a phone number hashed from its E.164 form, so a number sent in
// any other format is quietly unmatched rather than reported. Normalising is opt in: the default
// leaves the number exactly as mapped, which is what mappings written before this existed expect.
export function normalisePhone(
  value: string,
  phoneOptions?: PhoneOptions,
  contactInfoCountryCode?: CountryCode
): string | undefined {
  if (isHashed(value)) {
    return value
  }

  const phone = value.trim()

  // Nothing downstream rejects an empty string - it would be hashed and sent as the digest of ''.
  if (!phone) {
    return undefined
  }

  const normalization = phoneOptions?.normalization ?? PHONE_NORMALIZATION_NONE

  if (normalization === PHONE_NORMALIZATION_NONE) {
    return phone
  }

  const parsed = parsePhone(phone, phoneCountry(phoneOptions, contactInfoCountryCode))

  if (!parsed) {
    return normalization === PHONE_NORMALIZATION_VALIDATE ? undefined : phone
  }

  return phoneUtil.format(parsed, PhoneNumberFormat.E164)
}

function phoneCountry(phoneOptions?: PhoneOptions, contactInfoCountryCode?: CountryCode): CountryCode | undefined {
  return (
    (phoneOptions?.useContactInfoCountryCode ? contactInfoCountryCode : undefined) || phoneOptions?.defaultCountryCode
  )
}

// A + or a leading 00 states the number's own country, so it is read without one being set. Any
// other format is a local number, which can only be resolved against the country it belongs to.
function parsePhone(phone: string, country?: CountryCode) {
  if (phone.startsWith('+')) {
    return tryParse(phone)
  }

  if (phone.startsWith('00')) {
    return tryParse(`+${phone.slice(2)}`)
  }

  return country ? tryParse(phone, country) : undefined
}

function tryParse(phone: string, country?: CountryCode) {
  try {
    const parsed = phoneUtil.parse(phone, country)

    return phoneUtil.isValidNumber(parsed) ? parsed : undefined
  } catch (error) {
    return undefined
  }
}

export function toList(value?: string): string[] {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
}

export function buildContactInfo(
  mappedContactInfo: Payload['contact_info'],
  phoneOptions?: PhoneOptions
): ContactInfo | undefined {
  const { emails, phoneNumbers, zipCodes, firstName, lastName, countryCode } = mappedContactInfo ?? {}

  const trimmedCountryCode = countryCode?.trim().toUpperCase() as CountryCode | undefined

  // An email which cannot be valid is dropped rather than hashed and sent, since Google can only
  // report it as an unmatched member. A user is still synced on whatever is left, and an event
  // with nothing left over fails as having no usable identifier. A phone number is only dropped
  // the same way once the mapping has opted in to validating them.
  const hashedEmails = toList(emails)
    .map(normaliseEmail)
    .filter(isPresent)
    .map((email) => hash(email, stripSpaces))
  const hashedPhoneNumbers = toList(phoneNumbers)
    .map((phoneNumber) => normalisePhone(phoneNumber, phoneOptions, trimmedCountryCode))
    .filter(isPresent)
    .map((phoneNumber) => hash(phoneNumber, trimOnly))
  const zipCodeList = toList(zipCodes)
  const trimmedFirstName = firstName?.trim()
  const trimmedLastName = lastName?.trim()

  const contactInfo: ContactInfo = {
    ...(hashedEmails.length > 0 ? { hashedEmails } : {}),
    ...(hashedPhoneNumbers.length > 0 ? { hashedPhoneNumbers } : {}),
    // Google requires zipCodes, hashedFirstName, hashedLastName and countryCode to be sent together.
    ...(zipCodeList.length > 0 && trimmedFirstName && trimmedLastName && trimmedCountryCode
      ? {
          zipCodes: zipCodeList,
          hashedFirstName: hash(trimmedFirstName, trimAndLower),
          hashedLastName: hash(trimmedLastName, trimAndLower),
          countryCode: trimmedCountryCode
        }
      : {})
  }

  return Object.keys(contactInfo).length > 0 ? contactInfo : undefined
}

// Display & Video 360 rejects a request carrying both an added and a removed list: "An edit
// customer match request can either add or remove customers. It cannot do both." One call
// therefore builds one list, and adds and removes are sent as separate requests.
export function buildJSON(
  advertiserId: string,
  audienceType: string,
  members: Member[],
  isAdd: boolean,
  consent?: Consent
): EditCustomerMatchMembersRequest {
  const consentJSON = consent && Object.keys(consent).length > 0 ? { consent } : {}

  if (audienceType === CONTACT_INFO) {
    const list: ContactInfoList = { contactInfos: members as ContactInfo[], ...consentJSON }

    return { advertiserId, ...(isAdd ? { addedContactInfoList: list } : { removedContactInfoList: list }) }
  }

  const list: MobileDeviceIdList = { mobileDeviceIds: members as string[], ...consentJSON }

  return { advertiserId, ...(isAdd ? { addedMobileDeviceIdList: list } : { removedMobileDeviceIdList: list }) }
}

export function resolveAudienceDetails(
  payload: Payload,
  audienceSettings?: AudienceSettings,
  hookOutputs?: HookOutputs
): ResolvedAudience {
  const audienceId = getAudienceId(payload, hookOutputs)
  const advertiserId = getAdvertiserId(audienceSettings, hookOutputs)
  const audienceType = getAudienceType(audienceSettings, hookOutputs)

  const audienceErrorMessage = validateAudienceDetails(audienceId, advertiserId, audienceType)

  return audienceErrorMessage
    ? { audienceErrorMessage }
    : { audienceDetails: { audienceId, advertiserId, audienceType } as AudienceTarget }
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

  // The audience's type comes from the audience settings or the mapping save hook. It is what
  // decides which identifiers are sent, so the mapping does not restate it.
  if (!audienceType) {
    problems.push(
      `Missing the audience's type. Set the '${AUDIENCE_TYPE_LABEL}' audience setting, or the '${AUDIENCE_TYPE_LABEL}' field in the '${RETL_HOOK_LABEL}' step when syncing from a warehouse`
    )
  } else if (audienceType !== CONTACT_INFO && audienceType !== DEVICE_ID) {
    problems.push(`Unrecognised audience type: ${audienceType}. The audience must be ${CONTACT_INFO} or ${DEVICE_ID}`)
  }

  return problems.length > 0 ? problems.join('. ') : undefined
}

export function buildMember(
  payload: Payload,
  membership: AudienceMembership,
  audienceTarget: AudienceTarget
): { members?: Member[]; errortype?: keyof typeof ErrorCodes; errormessage?: string } {
  const { audienceId, audienceType } = audienceTarget
  const { contact_info, phone_options, external_id, mobileDeviceIds } = payload

  if (typeof membership !== 'boolean') {
    return {
      errortype: ErrorCodes.INVALID_AUDIENCE_MEMBERSHIP,
      errormessage: 'Audience membership could not be resolved to a boolean'
    }
  }

  if (external_id && external_id !== audienceId) {
    return {
      errortype: ErrorCodes.PAYLOAD_VALIDATION_FAILED,
      errormessage: 'Event does not belong to the same audience as the rest of the batch'
    }
  }

  const isContactInfo = audienceType === CONTACT_INFO
  const contactInfo = isContactInfo
    ? buildContactInfo(contact_info, phone_options as PhoneOptions | undefined)
    : undefined
  const members: Member[] = isContactInfo ? (contactInfo ? [contactInfo] : []) : toList(mobileDeviceIds)

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
