import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'

const COMPUTATION_KEY = 'e2e_test_dv360_create_or_connect'
const COMPUTATION_ID = 'aud_e2e_dv360_create_or_connect_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID,EXISTING_CONTACT_INFO_ID,' +
  'EXISTING_DEVICE_ID} and ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The existing ids must be a contact ' +
  'info and a device ID audience in the advertiser.'

const contactInfoMapping = defaultValues(syncAudience.fields)

// mobileDeviceIds defaults to context.traits.mobileDeviceIds, which no event helper populates, so
// the device ID fixtures map it from the enriched traits instead.
const deviceIdMapping = {
  ...defaultValues(syncAudience.fields),
  mobileDeviceIds: { '@path': '$.properties.mobileDeviceIds' }
}

// Whether createAudience took the right path for each Create or Connect Audience option is settled
// in the config: an audience whose create goes wrong stops the run there. These prove the id each
// option returned is one Display & Video 360 accepts members for. A batch holding an add and a
// remove is split into one request per direction, so each fixture exercises both.
const contactInfoFixture = (key: string, description: string): E2EFixture => ({
  description,
  subscribe: 'type = "track"',
  mapping: contactInfoMapping,
  mode: 'batchWithMultistatus',
  audience: key,
  events: [
    createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      eventName: 'Audience Entered',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: `$externalAudienceId:${key}`,
      userId: `e2e-dv360-${key}-add`,
      email: `e2e-dv360-${key}-add@segment.com`
    }),
    createE2EEngageAudienceEvent({
      type: 'track',
      action: 'remove',
      eventName: 'Audience Exited',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: `$externalAudienceId:${key}`,
      userId: `e2e-dv360-${key}-remove`,
      email: `e2e-dv360-${key}-remove@segment.com`
    })
  ],
  expect: {
    status: 'success',
    jsonContains: [
      { status: 200, body: { firstPartyAndPartnerAudienceId: `$externalAudienceId:${key}` } },
      { status: 200, body: { firstPartyAndPartnerAudienceId: `$externalAudienceId:${key}` } }
    ]
  },
  verboseFailureHint: FAILURE_HINT
})

const deviceIdFixture = (key: string, description: string): E2EFixture => ({
  description,
  subscribe: 'type = "track"',
  mapping: deviceIdMapping,
  mode: 'batchWithMultistatus',
  audience: key,
  events: [
    createE2EEngageAudienceEvent({
      type: 'track',
      action: 'add',
      eventName: 'Audience Entered',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: `$externalAudienceId:${key}`,
      userId: `e2e-dv360-${key}-add`,
      enrichedTraits: { mobileDeviceIds: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0020' }
    }),
    createE2EEngageAudienceEvent({
      type: 'track',
      action: 'remove',
      eventName: 'Audience Exited',
      computationKey: COMPUTATION_KEY,
      computationId: COMPUTATION_ID,
      externalAudienceId: `$externalAudienceId:${key}`,
      userId: `e2e-dv360-${key}-remove`,
      enrichedTraits: { mobileDeviceIds: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0021' }
    })
  ],
  expect: {
    status: 'success',
    jsonContains: [
      {
        status: 200,
        sent: { addedMobileDeviceIdList: { mobileDeviceIds: ['aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0020'] } },
        body: { firstPartyAndPartnerAudienceId: `$externalAudienceId:${key}` }
      },
      {
        status: 200,
        sent: { removedMobileDeviceIdList: { mobileDeviceIds: ['aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0021'] } },
        body: { firstPartyAndPartnerAudienceId: `$externalAudienceId:${key}` }
      }
    ]
  },
  verboseFailureHint: FAILURE_HINT
})

const fixtures: E2EFixture[] = [
  contactInfoFixture('explicitCreate', 'Create: an audience created under the Audience Name override takes members'),
  contactInfoFixture(
    'connectContactInfo',
    'Create or connect: a contact info audience connected by name takes members'
  ),
  deviceIdFixture('connectDeviceId', 'Create or connect: a device ID audience connected by name takes members'),
  contactInfoFixture(
    'connectQuotedName',
    'Create or connect: an audience whose name holds a quote and a backslash takes members'
  ),
  contactInfoFixture('existingContactInfo', 'Existing: a contact info audience connected by id takes members'),
  deviceIdFixture('existingDeviceId', 'Existing: a device ID audience connected by id takes members')
]

export default fixtures
