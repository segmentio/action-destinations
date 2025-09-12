import { IntegrationError, PayloadValidationError, RequestClient } from '@segment/actions-core'
import type { Payload } from './syncUserData/generated-types'
import { processHashing } from '../../lib/hashing-utils'
import type { AudienceSettings, Settings } from './generated-types'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'
import { SEGMENT_DATA_PARTNER_ID } from './constants'

export const verifyCustomerId = (customerId: string | undefined) => {
  if (!customerId) {
    throw new PayloadValidationError('Customer ID is required.')
  }
  return customerId.replace(/-/g, '')
}

function buildUserIdentifiers(payload: Payload) {
  const identifiers: Array<Record<string, unknown>> = []

  if (payload.emailAddress) {
    identifiers.push({
      emailAddress: processHashing(payload.emailAddress, 'sha256', 'hex')
    })
  }

  if (payload.phoneNumber) {
    identifiers.push({
      phoneNumber: processHashing(payload.phoneNumber, 'sha256', 'hex')
    })
  }

  if (payload.givenName || payload.familyName || payload.regionCode || payload.postalCode) {
    identifiers.push({
      address: {
        givenName: payload.givenName ? processHashing(payload.givenName, 'sha256', 'hex') : undefined,
        familyName: payload.familyName ? processHashing(payload.familyName, 'sha256', 'hex') : undefined,
        regionCode: payload.regionCode,
        postalCode: payload.postalCode
      }
    })
  }

  return identifiers
}

function buildAudienceMember(payload: Payload) {
  return {
    consent: {
      adUserData: 'CONSENT_GRANTED',
      adPersonalization: 'CONSENT_GRANTED'
    },
    userData: {
      userIdentifiers: buildUserIdentifiers(payload)
    }
  }
}

export async function ingestAudienceMembers(
  request: RequestClient,
  settings: Settings,
  payloads: Payload[],
  audienceSettings: AudienceSettings,
  auth?: AuthTokens
) {
  const accessToken = auth?.accessToken || ''
  if (!accessToken) throw new IntegrationError('Missing access token.', 'ACCESS_TOKEN_MISSING', 401)
  const body = buildRequestBody(payloads, settings, audienceSettings)
  return request('https://datamanager.googleapis.com/v1/audienceMembers:ingest', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    json: body
  })
}

const buildRequestBody = (payloads: Payload[], settings: Settings, audienceSettings: AudienceSettings) => ({
  audienceMembers: payloads.map(buildAudienceMember),
  destinations: [
    {
      operatingAccount: {
        accountId: settings.advertiserAccountId,
        product: audienceSettings.product
      },
      loginAccount: {
        accountId: `${SEGMENT_DATA_PARTNER_ID}`,
        product: 'DATA_PARTNER'
      },
      productDestinationId: audienceSettings.productDestinationId
    }
  ],
  encoding: 'HEX',
  termsOfService: {
    customerMatchTermsOfServiceStatus: 'ACCEPTED'
  }
})
