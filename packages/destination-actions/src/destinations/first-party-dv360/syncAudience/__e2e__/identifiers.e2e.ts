import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'
import { CONTACT_INFO, DEVICE_ID } from '../constants'

const COMPUTATION_KEY = 'e2e_test_dv360_identifiers'
const COMPUTATION_ID = 'aud_e2e_dv360_identifiers_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const ADVERTISER_ID = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''

const contactInfoMapping = { ...defaultValues(syncAudience.fields), audience_type: CONTACT_INFO }

// mobileDeviceIds defaults to context.traits.mobileDeviceIds, which no event helper populates, so
// the device ID fixtures map it from the enriched traits instead.
const deviceIdMapping = {
  ...defaultValues(syncAudience.fields),
  audience_type: DEVICE_ID,
  mobileDeviceIds: { '@path': '$.properties.mobileDeviceIds' }
}

// Which identifier shapes Display & Video 360 accepts once the action has normalised and hashed
// them. Whether a bad value is dropped before it gets here is settled locally and covered by the
// unit tests: nothing about it is observable in the API, which takes any well formed digest and
// simply never matches it.
//
// Each fixture sends one event and asserts the request that event produced. Consent has no default,
// so it is unmapped here and left off the request altogether.
const fixtures: E2EFixture[] = [
  {
    description: 'Identifiers: an email only',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-id-email',
        email: 'e2e-dv360-email@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['78d8462aa66cf7af1d5eccaa2addcfd82d917ec230d038fa4a91131b964c501d'] }]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Identifiers: a phone number only, sent as it was given',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-id-phone',
        enrichedTraits: { phone: '+14155550123' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [
                { hashedPhoneNumbers: ['36a2cef4ff9bf7a1abd2a93359136b870393be4106e6c5d19b72ff564f9deca4'] }
              ]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Display & Video 360 requires zip, first name, last name and country together or not at all.
    description: 'Identifiers: a complete address group',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-id-address',
        enrichedTraits: { zipCodes: '94105', firstName: 'Jane', lastName: 'Doe', countryCode: 'us' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [
                {
                  zipCodes: ['94105'],
                  hashedFirstName: '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2',
                  hashedLastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
                  // Lower case 'us' on the event, upper cased before it is sent.
                  countryCode: 'US'
                }
              ]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Identifiers: email, phone and address on one member',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-id-combined',
        email: 'e2e-dv360-combined@segment.com',
        enrichedTraits: {
          phone: '+442079460958',
          zipCodes: '94105',
          firstName: 'Jane',
          lastName: 'Doe',
          countryCode: 'US'
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [
                {
                  hashedEmails: ['03d54d0af4c6dc16a1fd83cbbc158dee7c8016c6594e9631823734c812763ea2'],
                  hashedPhoneNumbers: ['f0bf0228144d9fe2bdf1da2d8ca698f17bf1410ee688b075c27062e47b6f0b6d'],
                  zipCodes: ['94105'],
                  hashedFirstName: '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2',
                  hashedLastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
                  countryCode: 'US'
                }
              ]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Mobile device IDs are sent as they are: Display & Video 360 does not want them hashed.
    description: 'Identifiers: a single mobile device ID',
    subscribe: 'type = "track"',
    mapping: deviceIdMapping,
    mode: 'batchWithMultistatus',
    audience: 'deviceId',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:deviceId',
        userId: 'e2e-dv360-id-device-one',
        enrichedTraits: { mobileDeviceIds: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0010' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedMobileDeviceIdList: { mobileDeviceIds: ['aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0010'] }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:deviceId' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Identifiers: several mobile device IDs from one comma separated value',
    subscribe: 'type = "track"',
    mapping: deviceIdMapping,
    mode: 'batchWithMultistatus',
    audience: 'deviceId',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:deviceId',
        userId: 'e2e-dv360-id-device-many',
        enrichedTraits: {
          mobileDeviceIds:
            'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0011, aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0012 ,aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0013'
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedMobileDeviceIdList: {
              // Split on the commas, and the surrounding spaces trimmed off.
              mobileDeviceIds: [
                'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0011',
                'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0012',
                'aaaaaaaa-bbbb-cccc-dddd-eeeeeeee0013'
              ]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:deviceId' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // A value which is already a digest is passed through untouched. The digest below is the one
    // the E.164 fixture produces, so hashing it again would show up as a different value.
    description: 'Phone numbers: a number which is already hashed is not hashed again',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-phone-prehashed',
        enrichedTraits: { phone: '36a2cef4ff9bf7a1abd2a93359136b870393be4106e6c5d19b72ff564f9deca4' }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [
                { hashedPhoneNumbers: ['36a2cef4ff9bf7a1abd2a93359136b870393be4106e6c5d19b72ff564f9deca4'] }
              ]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Batches: three users are added and each reports its own member',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-batch-1',
        email: 'e2e-dv360-batch-1@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-batch-2',
        email: 'e2e-dv360-batch-2@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-batch-3',
        email: 'e2e-dv360-batch-3@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['9f4471f96e5b18495111739665fa1c2099057e0676783a05a18d2fdaf3da1cb6'] }]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        },
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['5d135dc19f5543fdda993db1001b090b788f073520be46205b231865e53931de'] }]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        },
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['bbce0058bf82bab33c51f011dc78111d20725dc97fe82e736eb584542185df1d'] }]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The middle event has nothing to identify the user by, so it never leaves. The events either
    // side of it still sync, and all three keep the position they arrived in.
    description: 'Batches: an event with no usable identifier fails without disturbing the others',
    subscribe: 'type = "track"',
    mapping: contactInfoMapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-batch-ok',
        email: 'e2e-dv360-batch-ok@segment.com'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-batch-empty'
      }),
      createE2EEngageAudienceEvent({
        type: 'track',
        action: 'add',
        eventName: 'Audience Entered',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId:contactInfo',
        userId: 'e2e-dv360-batch-3',
        email: 'e2e-dv360-batch-3@segment.com'
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['5deec69341f4d359dc765a9646fee0639d1334090106ffd680580f1de0200694'] }]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        },
        { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' },
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: {
              contactInfos: [{ hashedEmails: ['bbce0058bf82bab33c51f011dc78111d20725dc97fe82e736eb584542185df1d'] }]
            }
          },
          body: { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
