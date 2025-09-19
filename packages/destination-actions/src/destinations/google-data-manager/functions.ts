import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import type { Payload } from './syncUserData/generated-types'
import { processHashing } from '../../lib/hashing-utils'
import type { AudienceSettings } from './generated-types'
import { SEGMENT_DATA_PARTNER_ID } from './constants'
import { getDataPartnerToken } from './data-partner-token'

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
      adUserData: 'CONSENT_GRANTED', // TODO: should this come from the event?
      adPersonalization: 'CONSENT_GRANTED'
    },
    userData: {
      userIdentifiers: buildUserIdentifiers(payload)
    }
  }
}

export async function syncAudienceMembers(
  request: RequestClient,
  payloads: Payload[],
  audienceSettings: AudienceSettings
) {
  const accessToken = await getDataPartnerToken()
  const audienceEnteredPayloads = payloads.filter((payload) => payload.event_name === 'Audience Entered')
  const audienceExitedPayloads = payloads.filter((payload) => payload.event_name === 'Audience Exited')
  const audienceEnteredBody =
    audienceEnteredPayloads.length > 0 ? buildRequestBody(audienceEnteredPayloads, audienceSettings) : undefined
  const audienceExitedBody =
    audienceExitedPayloads.length > 0 ? buildRequestBody(audienceExitedPayloads, audienceSettings) : undefined
  console.log('audienceEnteredBody', JSON.stringify(audienceEnteredBody, null, 2))
  console.log('audienceExitedBody', JSON.stringify(audienceExitedBody, null, 2))

  if (!audienceEnteredBody && !audienceExitedBody) {
    throw new PayloadValidationError('No valid payloads to process. Ensure event_name is set correctly.')
  }

  const responses = []

  const datamanagerAudienceMembersUrl = 'https://datamanager.googleapis.com/v1/audienceMembers'
  const requestConfigs = [
    {
      body: audienceEnteredBody,
      url: datamanagerAudienceMembersUrl + ':ingest'
    },
    {
      body: audienceExitedBody,
      url: datamanagerAudienceMembersUrl + ':remove'
    }
  ]

  for (const { body, url } of requestConfigs) {
    if (body !== undefined) {
      responses.push(
        await request(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
            'Content-Type': 'application/json'
          },
          json: body
        })
      )
    }
  }
  console.log('responses', JSON.stringify(responses, null, 2))
  return responses.length === 1 ? responses[0] : responses
}

const buildRequestBody = (payloads: Payload[], audienceSettings: AudienceSettings) => ({
  audienceMembers: payloads.map(buildAudienceMember),
  destinations: [
    {
      operatingAccount: {
        accountId: audienceSettings.advertiserAccountId,
        product: audienceSettings.product
      },
      loginAccount: {
        accountId: `${SEGMENT_DATA_PARTNER_ID}`,
        product: 'DATA_PARTNER'
      },
      productDestinationId: payloads[0].audienceId
    }
    // TODO: Add more destinations from settings
  ],
  encoding: 'HEX',
  termsOfService: {
    customerMatchTermsOfServiceStatus: 'ACCEPTED' // todo: should this come from the event?
  }
})
