import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import { Payload as UploadPayload } from './conversionUpload/generated-types'
import { Payload as Adjustayload } from './conversionAdjustmentUpload/generated-types'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'
import { Settings } from './generated-types'

import {
  CustomVarTypeChoices,
  EntityType,
  Source,
  InsertRequest,
  UserIdentifier,
  AddressInfo,
  Conversion,
  CartData,
  ConsentType,
  EncryptionInfo
} from './types'
import { processHashing } from '../../lib/hashing-utils'

export async function send(
  request: RequestClient,
  settings: Settings,
  payloads: UploadPayload[] | Adjustayload[],
  isAdjustment: boolean,
  auth?: AuthTokens
) {
  const json = getJSON(payloads, settings)

  if (json.conversions.length === 0) {
    maybeThrow(`No valid payloads found in batch of size ${payloads.length}`, true)
  }

  const response = await request(
    `https://dfareporting.googleapis.com/dfareporting/v4/userprofiles/${settings.profileId}/conversions/batch` +
      (isAdjustment ? 'update' : 'insert'),
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth?.accessToken}`,
        'Content-Type': 'application/json',
        Host: 'dfareporting.googleapis.com'
      },
      json
    }
  )
  return response
}

export function getJSON(payloads: UploadPayload[] | Adjustayload[], settings: Settings): InsertRequest {
  const json: InsertRequest = {
    conversions: [] as Conversion[],
    kind: 'dfareporting#conversionsBatchInsertRequest'
  }

  const shouldThrow = payloads.length === 1

  for (const payload of payloads) {
    const {
      customVariables,
      requiredId: { encryptedUserIdCandidates }
    } = payload as UploadPayload

    const {
      requiredId: { gclid, dclid, encryptedUserId, mobileDeviceId, matchId, impressionId },
      encryptionInfo,
      adUserDataConsent,
      cartDataItems,
      merchantId,
      merchantFeedLabel,
      merchantFeedLanguage,
      userDetails,
      floodlightActivityId,
      floodlightConfigurationId,
      timestamp,
      value,
      ordinal,
      quantity,
      limitAdTracking,
      childDirectedTreatment,
      nonPersonalizedAd,
      treatmentForUnderage
    } = payload

    if (
      [gclid, dclid, encryptedUserId, mobileDeviceId, matchId, impressionId, encryptedUserIdCandidates].filter(Boolean)
        .length !== 1
    ) {
      maybeThrow(
        'Exactly one of Google Click ID, Display Click ID, Encrypted User ID, Mobile Device ID, Match ID, Impression ID or Encrypted User ID Candidates is required',
        shouldThrow
      )
      continue
    }

    if (!floodlightActivityId && !settings.defaultFloodlightActivityId) {
      maybeThrow('Floodlight Activity ID is required', shouldThrow)
      continue
    }

    if (!floodlightConfigurationId && !settings.defaultFloodlightConfigurationId) {
      maybeThrow('Floodlight Configuration ID is required', shouldThrow)
      continue
    }

    if ((encryptedUserId || encryptedUserIdCandidates) && !encryptionInfo) {
      maybeThrow(
        'Encrypted Info field should be populated if either Encrypted User ID or Encrypted User ID Candidates fields are populated',
        shouldThrow
      )
      continue
    }

    const conversion = {
      adUserDataConsent: adUserDataConsent as ConsentType | undefined,
      cartData: (() => {
        if (
          !Array.isArray(cartDataItems) ||
          cartDataItems.length === 0 ||
          merchantId ||
          !merchantFeedLabel ||
          !merchantFeedLanguage
        ) {
          return undefined
        }
        return {
          merchantId,
          merchantFeedLabel,
          merchantFeedLanguage,
          items: cartDataItems
        } as CartData
      })(),
      childDirectedTreatment: childDirectedTreatment ?? undefined,
      dclid: dclid ?? undefined,
      encryptedUserId: encryptedUserId ?? undefined,
      floodlightActivityId: (floodlightActivityId ?? settings.defaultFloodlightActivityId) as string,
      floodlightConfigurationId: (floodlightConfigurationId ?? settings.defaultFloodlightConfigurationId) as string,
      gclid: gclid ?? undefined,
      impressionId: impressionId ?? undefined,
      kind: 'dfareporting#conversion',
      limitAdTracking: limitAdTracking ?? undefined,
      matchId: matchId ?? undefined,
      mobileDeviceId: mobileDeviceId ?? undefined,
      nonPersonalizedAd: nonPersonalizedAd ?? undefined,
      ordinal,
      quantity,
      timestampMicros: (() => {
        return String(BigInt(new Date(timestamp).getTime()) * 1000n)
      })(),
      treatmentForUnderage: treatmentForUnderage ?? undefined,
      userIdentifiers: (() => {
        const { email, phone, firstName, lastName, streetAddress, city, state, postalCode, countryCode } =
          userDetails ?? {}
        const identifiers: UserIdentifier[] = []
        if (email) {
          identifiers.push({
            hashedEmail: processHashing(email, 'sha256', 'hex')
          })
        }
        if (phone) {
          identifiers.push({
            hashedPhoneNumber: processHashing(phone, 'sha256', 'hex')
          })
        }
        if (firstName || lastName || streetAddress || city || state || postalCode || countryCode) {
          const addressInfo: AddressInfo = {
            hashedFirstName: firstName ? processHashing(firstName, 'sha256', 'hex') : undefined,
            hashedLastName: lastName ? processHashing(lastName, 'sha256', 'hex') : undefined,
            hashedStreetAddress: streetAddress ? processHashing(streetAddress, 'sha256', 'hex') : undefined,
            city: city ?? undefined,
            state: state ?? undefined,
            postalCode: postalCode ?? undefined,
            countryCode: countryCode ?? undefined
          }
          identifiers.push({ addressInfo })
        }
        return identifiers
      })(),
      value,
      customVariables: Array.isArray(customVariables)
        ? customVariables
            .filter((c) => c.type.length > 0 && c.value.length > 0)
            .map((c) => ({
              type: c.type,
              value: c.value,
              kind: 'dfareporting#customFloodlightVariable'
            }))
        : [],
      encryptedUserIdCandidates:
        encryptedUserIdCandidates
          ?.split(',')
          .map((value) => {
            return processHashing(value, 'sha256', 'hex')
          })
          .filter((str): str is string => str !== undefined) ?? []
    } as Conversion

    json.conversions.push(conversion)

    json.encryptionInfo =
      encryptedUserId || encryptedUserIdCandidates
        ? ({
            ...encryptionInfo,
            kind: 'dfareporting#encryptionInfo'
          } as EncryptionInfo)
        : undefined
  }
  return json
}

function maybeThrow(message: string, shouldThrow: boolean) {
  if (shouldThrow) {
    throw new PayloadValidationError(message)
  }
}

export function getCustomVarTypeChoices(): Array<{ value: string; label: string }> {
  return CustomVarTypeChoices.map((item) => ({
    label: item,
    value: item
  }))
}

export function getEntityTypeChoices(): Array<{ value: string; label: string }> {
  return Object.values(EntityType).map((item) => ({
    label: item,
    value: item
  }))
}

export function getSources(): Array<{ value: string; label: string }> {
  return Object.values(Source).map((item) => ({
    label: item,
    value: item
  }))
}
