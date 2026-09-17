/**
 * Required environment variables:
 * - E2E_FIRST_PARTY_DV360_CLIENT_ID: OAuth client ID, from actions_first_party_dv360_client_id
 * - E2E_FIRST_PARTY_DV360_CLIENT_SECRET: OAuth client secret, from actions_first_party_dv360_client_secret
 * - E2E_FIRST_PARTY_DV360_REFRESH_TOKEN: a refresh token carrying the
 *   https://www.googleapis.com/auth/display-video scope, for an account with access to the
 *   advertiser below. The copy in the secret store has expired; a live one can be read from the
 *   oauth row of a staging destination instance.
 * - E2E_FIRST_PARTY_DV360_ADVERTISER_ID: the advertiser the audiences are created in
 * - E2E_FIRST_PARTY_DV360_APP_ID: the app the mobile device IDs belong to. Display & Video 360 does
 *   not validate this against a real app, so any stable value works.
 *
 * createAudience and getAudience read the OAuth client straight from the environment rather
 * than from settings, so these are needed as well, with the same values:
 * - ACTIONS_FIRST_PARTY_DV360_CLIENT_ID
 * - ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET
 */
import type { E2EAudienceDestinationConfig } from '@segment/actions-core'
import { CONTACT_INFO, DEVICE_ID } from '../syncAudience/constants'

const advertiserId = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''
const run = Date.now()

// Display & Video 360 has no delete method for firstPartyAndPartnerAudiences: create, get, list,
// patch and editCustomerMatchMembers are the only operations. Every run therefore leaves its two
// audiences behind in the advertiser, which is accepted. They are created with the shortest
// membership duration so the members they are sent age out the next day.
const MEMBERSHIP_DURATION_DAYS = '1'

export const config: E2EAudienceDestinationConfig = {
  settings: {
    oauth: {
      access_token: 'will_be_refreshed',
      refresh_token: { $env: 'E2E_FIRST_PARTY_DV360_REFRESH_TOKEN' },
      clientId: { $env: 'E2E_FIRST_PARTY_DV360_CLIENT_ID' },
      clientSecret: { $env: 'E2E_FIRST_PARTY_DV360_CLIENT_SECRET' }
    }
  },
  // One audience per type the action supports. A fixture picks the one it needs with
  // `audience: 'contactInfo' | 'deviceId'`, which decides both the audienceSettings injected into
  // context.personas.audience_settings and the id behind '$externalAudienceId:<key>'.
  audience: [
    {
      key: 'contactInfo',
      audienceName: `e2e_contact_info_${run}`,
      audienceSettings: {
        advertiserId,
        audienceType: CONTACT_INFO,
        membershipDurationDays: MEMBERSHIP_DURATION_DAYS,
        description: 'Segment e2e test audience'
      },
      createAudience: true,
      getAudience: true,
      teardown: false
    },
    {
      key: 'deviceId',
      audienceName: `e2e_device_id_${run}`,
      audienceSettings: {
        advertiserId,
        audienceType: DEVICE_ID,
        membershipDurationDays: MEMBERSHIP_DURATION_DAYS,
        description: 'Segment e2e test audience',
        appId: process.env.E2E_FIRST_PARTY_DV360_APP_ID ?? ''
      },
      createAudience: true,
      getAudience: true,
      teardown: false
    }
  ]
}
