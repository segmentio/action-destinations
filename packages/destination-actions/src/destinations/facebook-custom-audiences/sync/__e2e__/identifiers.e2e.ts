import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import sync from '../index'

const COMPUTATION_KEY = 'e2e_test_facebook_identifiers'
const COMPUTATION_ID = 'aud_e2e_facebook_identifiers_001'

const FAILURE_HINT =
  'Ensure E2E_FACEBOOK_CUSTOM_AUDIENCES_ACCESS_TOKEN and E2E_FACEBOOK_CUSTOM_AUDIENCES_AD_ACCOUNT_ID are set. The token must have ads_management permission.'

// Verifies the full identifier set is normalized + hashed into the correct Facebook schema slots.
// The `sent.data` row positions are:
// [externalId(unhashed), email, phone, dobYear, dobMonth, dobDay, lastName, firstName, firstInitial,
//  gender, city, state, zip, country, mobileAdId]
//
// `birth` (year/month/day), `name.firstInitial`, `mobileAdId`, `appId`, `pageId` and `igAccountIds`
// have NO default @path, so the fixtures that exercise them add explicit `mapping` entries pointing
// at the enriched traits below.
const fixtures: E2EFixture[] = [
  {
    // Exercises EVERY identifier slot in a single row: externalId, email, phone, birth year/month/day,
    // last/first name, first initial, gender, city, state, zip, country and mobileAdId. The fields
    // without a default @path are wired explicitly in `mapping`.
    //
    // Note: appId/pageId/igAccountIds are intentionally NOT exercised here. They land in the request
    // body's app_ids/page_ids/ig_account_ids arrays (not in the per-item `sent` row, so there is
    // nothing to assert), and Meta validates them against real registered Facebook app/page/IG IDs —
    // sending placeholder values fails the live request with "(#100) invalid app id".
    description: 'Identifiers: every schema slot (incl. birth, first initial, mobileAdId) is normalized and hashed',
    subscribe: 'type = "track" or type = "identify"',
    mapping: {
      ...defaultValues(sync.fields),
      birth: {
        year: { '@path': '$.traits.dob_year' },
        month: { '@path': '$.traits.dob_month' },
        day: { '@path': '$.traits.dob_day' }
      },
      name: {
        first: { '@path': '$.traits.first_name' },
        last: { '@path': '$.traits.last_name' },
        firstInitial: { '@path': '$.traits.first_initial' }
      },
      mobileAdId: { '@path': '$.traits.madid' }
    },
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'id-max-001',
        email: 'max@segment.com',
        enrichedTraits: {
          phone: '+1 (650) 555-0100',
          dob_year: '1990',
          dob_month: 'March',
          dob_day: '07',
          first_name: 'Jane',
          last_name: 'Doe',
          first_initial: 'J',
          gender: 'female',
          city: 'San Francisco',
          state: 'California',
          postal_code: '94105-1234',
          country: 'United States',
          madid: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            method: 'POST',
            data: [
              'id-max-001', // externalId (not hashed)
              '57103bd6f7816762760d11c6e79580f7d14d542cb5887bb2c49e05bb4b477652', // email
              '43b63f22d478442e6d58c9ba5eef8a8b378b9990aafb681d11e231e3ceab6294', // phone (normalized)
              'a7be8e1fe282a37cd666e0632b17d933fa13f21addf4798fc0455bc166e2488c', // dob year (1990)
              '0b8efa5a3bf104413a725c6ff0459a6be12b1fd33314cbb138745baf39504ae5', // dob month ('March' -> '03')
              '19b100ab7725c612f3d80ff203ca53cea5cadaafae3bf0f88f0fb4089fe08815', // dob day ('07')
              '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f', // last name (normalized)
              '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2', // first name (normalized)
              '189f40034be7a199f1fa9891668ee3ab6049f82d38c68be70f596eab2e1857b7', // first initial ('J' -> 'j')
              '252f10c83610ebca1a059c0bae8255eba2f95be4d1d7bcfa89d7248a82d9f111', // gender (normalized to 'f')
              '1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac', // city (normalized)
              '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126', // state (normalized to code)
              'e73ac16e69f060ee98b0fda5f66f48c4648ee26950e9bab3a097389853fd859e', // zip (normalized, dropped +4)
              'fd7321c405f8af43810a6723bbaf6fb5c9461aee273bc3693ee7903becc4e6ea', // country (normalized)
              'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' // mobileAdId (sent plaintext, not hashed — Meta expects lowercase UUID, hyphens kept)
            ]
          }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Identifiers: all PII fields are normalized and hashed into the Facebook schema row',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'e2e-fb-allid-001',
        email: 'allid@segment.com',
        enrichedTraits: {
          phone: '+1 (650) 555-0100',
          first_name: 'Jane',
          last_name: 'Doe',
          gender: 'female',
          city: 'San Francisco',
          state: 'California',
          postal_code: '94105-1234',
          country: 'United States'
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            method: 'POST',
            data: [
              'e2e-fb-allid-001', // externalId (not hashed)
              '086fff0fc73883ed7fad91b9dab6683b06540149e4bddc2f7649346c59bc33f1', // email
              '43b63f22d478442e6d58c9ba5eef8a8b378b9990aafb681d11e231e3ceab6294', // phone (normalized)
              '', // dob year
              '', // dob month
              '', // dob day
              '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f', // last name (normalized)
              '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2', // first name (normalized)
              '', // first initial
              '252f10c83610ebca1a059c0bae8255eba2f95be4d1d7bcfa89d7248a82d9f111', // gender (normalized to 'f')
              '1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac', // city (normalized)
              '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126', // state (normalized to code)
              'e73ac16e69f060ee98b0fda5f66f48c4648ee26950e9bab3a097389853fd859e', // zip (normalized, dropped +4)
              'fd7321c405f8af43810a6723bbaf6fb5c9461aee273bc3693ee7903becc4e6ea', // country (normalized)
              '' // mobileAdId
            ]
          }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // Batch of rows with DIFFERENT identifier subsets, verifying per-row normalization/hashing stays
    // correct and aligned across a multi-event batch:
    //  - row 0: full PII (add)
    //  - row 1: email + phone only (add)
    //  - row 2: externalId only, no other identifiers (add)
    //  - row 3: name + geo, no email, with messy input ("  JOHN  ", "O'Brien") to exercise
    //           trimming/lowercasing/punctuation-stripping (remove)
    description: 'Identifiers: batch with varied per-row identifier subsets are hashed correctly',
    subscribe: 'type = "track" or type = "identify"',
    mapping: defaultValues(sync.fields),
    mode: 'batchWithMultistatus',
    events: [
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'id-001',
        email: 'full@segment.com',
        enrichedTraits: {
          phone: '+1 (650) 555-0100',
          first_name: 'Jane',
          last_name: 'Doe',
          gender: 'female',
          city: 'San Francisco',
          state: 'California',
          postal_code: '94105-1234',
          country: 'United States'
        }
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'id-002',
        email: 'emailphone@segment.com',
        enrichedTraits: { phone: '+44 20 7946 0958' }
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'add',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'id-003'
      }),
      createE2EEngageAudienceEvent({
        type: 'identify',
        action: 'remove',
        computationKey: COMPUTATION_KEY,
        computationId: COMPUTATION_ID,
        externalAudienceId: '$externalAudienceId',
        userId: 'id-004',
        enrichedTraits: {
          first_name: '  JOHN  ',
          last_name: "O'Brien",
          city: 'New York',
          state: 'NY',
          postal_code: '10001',
          country: 'USA'
        }
      })
    ],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            method: 'POST',
            data: [
              'id-001',
              'e21fd535ca2f2ab8a6197eca83ea64d577e9ab8c2dbef578d7069a20d8fb1581', // email
              '43b63f22d478442e6d58c9ba5eef8a8b378b9990aafb681d11e231e3ceab6294', // phone
              '', '', '',
              '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f', // last name
              '81f8f6dde88365f3928796ec7aa53f72820b06db8664f5fe76a7eb13e24546a2', // first name
              '',
              '252f10c83610ebca1a059c0bae8255eba2f95be4d1d7bcfa89d7248a82d9f111', // gender
              '1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac', // city
              '6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126', // state
              'e73ac16e69f060ee98b0fda5f66f48c4648ee26950e9bab3a097389853fd859e', // zip
              'fd7321c405f8af43810a6723bbaf6fb5c9461aee273bc3693ee7903becc4e6ea', // country
              ''
            ]
          }
        },
        {
          status: 200,
          sent: {
            method: 'POST',
            data: [
              'id-002',
              '429e552d0a52bacdd8dbe36947ebe32fc5818724beaff8a0c8fda5e0e68ac18a', // email
              '35e206e5dec4c89b9e8b71b8c32724a5bb518483ac5a20c6617d738375b3b823', // phone
              '', '', '', '', '', '', '', '', '', '', '', ''
            ]
          }
        },
        {
          status: 200,
          sent: {
            method: 'POST',
            data: ['id-003', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
          }
        },
        {
          status: 200,
          sent: {
            method: 'DELETE',
            data: [
              'id-004',
              '', '', '', '', '',
              'b4cb6cb33fe4b865868de825023a1e2790dc12ac01ecc8d7c5afe8254071c8ba', // last name ("O'Brien" -> obrien)
              '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a', // first name ("  JOHN  " -> john)
              '',
              '',
              '350c754ba4d38897693aa077ef43072a859d23f613443133fecbbd90a3512ca5', // city
              '1b06e2003f8420d6fa42badd8f77ec0f706b976b7a48b13c567dc5a559681683', // state
              'e443169117a184f91186b401133b20be670c7c0896f9886075e5d9b81e9d076b', // zip
              '5fc90ab335783816990ffd960cbad0afd64510a53f895b4d02b9f8b279c0ed08', // country
              ''
            ]
          }
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
