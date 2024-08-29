import { createHash } from 'crypto'
import {
  CampaignManager360PayloadUserDetails,
  CampaignManager360RefreshTokenResponse,
  CampaignManager360Settings,
  CampaignManager360UserIdentifier
} from './types'
import { RequestClient } from '@segment/actions-core/*'

const isHashedInformation = (information: string): boolean => new RegExp(/[0-9abcdef]{64}/gi).test(information)
const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) {
    return
  }

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

export async function refreshGoogleAccessToken(request: RequestClient, settings: unknown): Promise<string> {
  const campaignManager360Settings = settings as CampaignManager360Settings
  const refreshTokenResponse = await request<CampaignManager360RefreshTokenResponse>(
    'https://www.googleapis.com/oauth2/v4/token',
    {
      method: 'POST',
      body: new URLSearchParams({
        refresh_token: campaignManager360Settings.refreshToken,
        client_id: campaignManager360Settings.clientId,
        client_secret: campaignManager360Settings.clientSecret,
        grant_type: 'refresh_token'
      })
    }
  )

  if (!refreshTokenResponse.data.access_token) {
    throw new Error('Failed to refresh access token.')
  }

  return refreshTokenResponse.data.access_token
}

export function resolveGoogleCampaignManager360UserIdentifiers(
  userDetails: CampaignManager360PayloadUserDetails
): CampaignManager360UserIdentifier[] {
  const userIdentifiers: CampaignManager360UserIdentifier[] = []
  if (userDetails.phone) {
    userIdentifiers.push({
      hashedPhoneNumber: isHashedInformation(userDetails.phone) ? userDetails.phone : hash(userDetails.phone)
    } as CampaignManager360UserIdentifier)
  }

  if (userDetails.email) {
    userIdentifiers.push({
      hashedEmail: isHashedInformation(userDetails.email) ? userDetails.email : hash(userDetails.email)
    } as CampaignManager360UserIdentifier)
  }

  const containsAddressInfo =
    userDetails.firstName ||
    userDetails.lastName ||
    userDetails.city ||
    userDetails.state ||
    userDetails.countryCode ||
    userDetails.postalCode ||
    userDetails.streetAddress

  if (containsAddressInfo) {
    userIdentifiers.push({
      addressInfo: {
        hashedFirstName: isHashedInformation(String(userDetails.firstName))
          ? userDetails.firstName
          : hash(userDetails.firstName),
        hashedLastName: isHashedInformation(String(userDetails.lastName))
          ? userDetails.lastName
          : hash(userDetails.lastName),
        hashedStreetAddress: isHashedInformation(String(userDetails.streetAddress))
          ? userDetails.streetAddress
          : hash(userDetails.streetAddress),
        city: userDetails.city,
        state: userDetails.state,
        countryCode: userDetails.countryCode,
        postalCode: userDetails.postalCode
      }
    })
  }

  return userIdentifiers
}
