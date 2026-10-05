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
 * - E2E_FIRST_PARTY_DV360_EXISTING_CONTACT_INFO_ID / E2E_FIRST_PARTY_DV360_EXISTING_DEVICE_ID: the
 *   ids of a contact info and a device ID audience which already exist in the advertiser, for the
 *   "Connect to existing audience" option. The reconnect audiences below, once a run has created
 *   them, serve.
 *
 * createAudience and getAudience read the OAuth client straight from the environment rather
 * than from settings, so these are needed as well, with the same values:
 * - ACTIONS_FIRST_PARTY_DV360_CLIENT_ID
 * - ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET
 */
import type { E2EAudienceConfig, E2EAudienceDestinationConfig } from '@segment/actions-core'
import { CONTACT_INFO, DEVICE_ID } from '../syncAudience/constants'

const advertiserId = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''
const appId = process.env.E2E_FIRST_PARTY_DV360_APP_ID ?? ''
const existingContactInfoId = process.env.E2E_FIRST_PARTY_DV360_EXISTING_CONTACT_INFO_ID ?? ''
const existingDeviceId = process.env.E2E_FIRST_PARTY_DV360_EXISTING_DEVICE_ID ?? ''
const run = Date.now()

// Display & Video 360 has no delete method for firstPartyAndPartnerAudiences: create, get, list,
// patch and editCustomerMatchMembers are the only operations. Every run therefore leaves the
// audiences it creates behind in the advertiser, which is accepted. They are created with the
// shortest membership duration so the members they are sent age out the next day.
const MEMBERSHIP_DURATION_DAYS = '1'

// Fixed names, so the first run ever creates these audiences and every later run finds them by name.
// That is what "Create new audience, or connect to an existing one with the same name" reconnects
// to, and what a plain create collides with. The quoted one proves the name filter's escaping.
export const RECONNECT_CONTACT_INFO_NAME = 'e2e_reconnect_contact_info'
export const RECONNECT_DEVICE_ID_NAME = 'e2e_reconnect_device_id'
export const RECONNECT_QUOTED_NAME = 'e2e_reconnect_"quoted"_\\name'

// An advertiser id Display & Video 360 rejects, and an audience id the advertiser does not own.
const BAD_ADVERTISER_ID = '999999999'
const UNOWNED_AUDIENCE_ID = '1234567890'

const contactInfoSettings = {
  advertiserId,
  audienceType: CONTACT_INFO,
  membershipDurationDays: MEMBERSHIP_DURATION_DAYS,
  description: 'Segment e2e test audience'
}

const deviceIdSettings = { ...contactInfoSettings, audienceType: DEVICE_ID, appId }

const audience = (
  key: string,
  audienceSettings: Record<string, unknown>,
  expectCreateError?: E2EAudienceConfig['expectCreateError']
): E2EAudienceConfig => ({
  key,
  audienceName: `e2e_${key}_${run}`,
  audienceSettings,
  createAudience: true,
  getAudience: !expectCreateError,
  teardown: false,
  ...(expectCreateError ? { expectCreateError } : {})
})

const createFailure = (errorMessageContains: string, httpStatus?: number) => ({
  errorType: 'IntegrationError',
  errorMessageContains,
  ...(httpStatus ? { httpStatus } : {})
})

export const config: E2EAudienceDestinationConfig = {
  settings: {
    oauth: {
      access_token: 'will_be_refreshed',
      refresh_token: { $env: 'E2E_FIRST_PARTY_DV360_REFRESH_TOKEN' },
      clientId: { $env: 'E2E_FIRST_PARTY_DV360_CLIENT_ID' },
      clientSecret: { $env: 'E2E_FIRST_PARTY_DV360_CLIENT_SECRET' }
    }
  },
  // A fixture picks the audience it needs with `audience: '<key>'`, which decides both the
  // audienceSettings injected into context.personas.audience_settings and the id behind
  // '$externalAudienceId:<key>'. The runner creates them in order and stops at the first create
  // which does not go as expected, so the audiences which must succeed come first, and the
  // reconnect ones come before the errors which collide with their names.
  audience: [
    // No operation: an audience saved before Create or Connect Audience existed is created.
    { ...audience('contactInfo', contactInfoSettings), audienceName: `e2e_contact_info_${run}` },
    { ...audience('deviceId', deviceIdSettings), audienceName: `e2e_device_id_${run}` },

    // The Audience Name override is what is sent: the Segment audience name collides with a
    // reconnect audience, so were it sent instead, the create would fail. The Existing Audience ID
    // is ignored when creating.
    {
      ...audience('explicitCreate', {
        ...contactInfoSettings,
        operation: 'create',
        audienceDisplayName: `e2e_named_${run}`,
        existingAudienceId: UNOWNED_AUDIENCE_ID
      }),
      audienceName: RECONNECT_CONTACT_INFO_NAME
    },

    // Reconnects by name, after the first run. The device ID one asks for a different App ID every
    // run, which is not compared: Display & Video 360 leaves it out of the list the name is found in.
    audience('connectContactInfo', {
      ...contactInfoSettings,
      operation: 'create_or_connect',
      audienceDisplayName: RECONNECT_CONTACT_INFO_NAME
    }),
    audience('connectDeviceId', {
      ...deviceIdSettings,
      operation: 'create_or_connect',
      audienceDisplayName: RECONNECT_DEVICE_ID_NAME,
      appId: `${appId}.${run}`
    }),
    audience('connectQuotedName', {
      ...contactInfoSettings,
      operation: 'create_or_connect',
      audienceDisplayName: RECONNECT_QUOTED_NAME
    }),

    // Connects by id. Whatever is set for creating is ignored.
    audience('existingContactInfo', {
      advertiserId,
      audienceType: CONTACT_INFO,
      operation: 'existing',
      existingAudienceId: existingContactInfoId,
      audienceDisplayName: `e2e_ignored_${run}`,
      membershipDurationDays: '30'
    }),
    audience('existingDeviceId', {
      advertiserId,
      audienceType: DEVICE_ID,
      operation: 'existing',
      existingAudienceId: existingDeviceId
    }),

    // Errors. None of these leaves an audience behind.
    audience(
      'errorNameExists',
      { ...contactInfoSettings, operation: 'create', audienceDisplayName: RECONNECT_CONTACT_INFO_NAME },
      createFailure(
        `An audience named "${RECONNECT_CONTACT_INFO_NAME}" already exists in Display & Video 360 (ID `,
        400
      )
    ),
    audience(
      'errorDurationMismatch',
      {
        ...contactInfoSettings,
        operation: 'create_or_connect',
        audienceDisplayName: RECONNECT_CONTACT_INFO_NAME,
        membershipDurationDays: '30'
      },
      createFailure('but its settings differ: Membership Duration Days is 1 (requested 30)', 400)
    ),
    audience(
      'errorTypeMismatch',
      { ...deviceIdSettings, operation: 'create_or_connect', audienceDisplayName: RECONNECT_CONTACT_INFO_NAME },
      createFailure(`Audience Type is ${CONTACT_INFO} (requested ${DEVICE_ID})`, 400)
    ),
    audience(
      'errorExistingTypeMismatch',
      { advertiserId, audienceType: DEVICE_ID, operation: 'existing', existingAudienceId: existingContactInfoId },
      createFailure(`its type is ${CONTACT_INFO}, but the Audience Type setting is ${DEVICE_ID}`, 400)
    ),
    audience(
      'errorExistingNotOwned',
      { advertiserId, audienceType: CONTACT_INFO, operation: 'existing', existingAudienceId: UNOWNED_AUDIENCE_ID },
      createFailure(`Failed to retrieve audience ${UNOWNED_AUDIENCE_ID} from Display & Video 360: `)
    ),
    audience(
      'errorBadAdvertiser',
      { ...contactInfoSettings, advertiserId: BAD_ADVERTISER_ID, operation: 'create' },
      createFailure('Failed to create audience in Display & Video 360: ')
    ),
    audience(
      'errorInvalidDuration',
      { ...contactInfoSettings, operation: 'create', membershipDurationDays: '541' },
      createFailure('Membership duration days must be a whole number greater than 0 and less than or equal to 540', 400)
    ),
    audience(
      'errorMissingExistingId',
      { advertiserId, audienceType: CONTACT_INFO, operation: 'existing' },
      createFailure('Missing Existing Audience ID value', 400)
    )
  ]
}
