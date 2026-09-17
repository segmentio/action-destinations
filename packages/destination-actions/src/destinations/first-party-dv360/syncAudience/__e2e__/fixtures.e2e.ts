import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'
import { CONTACT_INFO, DEVICE_ID } from '../constants'

const COMPUTATION_KEY = 'e2e_test_dv360_audience'
const COMPUTATION_ID = 'aud_e2e_dv360_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const contactInfoMapping = {
  ...defaultValues(syncAudience.fields),
  audience_type: CONTACT_INFO
}

const deviceIdMapping = {
  ...defaultValues(syncAudience.fields),
  audience_type: DEVICE_ID,
  mobileDeviceIds: { '@path': '$.properties.mobileDeviceIds' }
}

// Display & Video 360 only echoes the audience id back, so a 200 says the request was accepted and
// nothing about whether the members matched anyone.
const ACCEPTED = { status: 'success', httpStatus: 200 } as const

const fixtures: E2EFixture[] = [
  {
    description: 'Contact Info audience: add a user',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'single',
    audience: 'contactInfo',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      eventName: 'Audience Entered',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:contactInfo',
      userId: 'e2e-dv360-user-001',
      email: 'e2e-dv360-test-001@segment.com'
    }),
    expect: ACCEPTED,
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Contact Info audience: remove a user',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'single',
    audience: 'contactInfo',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'remove',
      eventName: 'Audience Exited',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:contactInfo',
      userId: 'e2e-dv360-user-001',
      email: 'e2e-dv360-test-001@segment.com'
    }),
    expect: ACCEPTED,
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Mobile Device ID audience: add a user',
    subscribe: 'type = "track"',
    mapping: deviceIdMapping,
    mode: 'single',
    audience: 'deviceId',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      eventName: 'Audience Entered',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:deviceId',
      userId: 'e2e-dv360-device-001',
      enrichedTraits: { mobileDeviceIds: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001' }
    }),
    expect: ACCEPTED,
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Mobile Device ID audience: remove a user',
    subscribe: 'type = "track"',
    mapping: deviceIdMapping,
    mode: 'single',
    audience: 'deviceId',
    event: createE2EEngageAudienceEvent({
      type: 'track',
      action: 'remove',
      eventName: 'Audience Exited',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: '$externalAudienceId:deviceId',
      userId: 'e2e-dv360-device-001',
      enrichedTraits: { mobileDeviceIds: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0001' }
    }),
    expect: ACCEPTED,
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
