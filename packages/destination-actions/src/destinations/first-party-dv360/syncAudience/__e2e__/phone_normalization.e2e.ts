import type { E2EFixture } from '@segment/actions-core'
import { defaultValues, createE2EEngageAudienceEvent } from '@segment/actions-core'
import syncAudience from '../index'
import { PHONE_NORMALIZATION_NORMALIZE, PHONE_NORMALIZATION_VALIDATE } from '../constants'

const COMPUTATION_KEY = 'e2e_test_dv360_phone'
const COMPUTATION_ID = 'aud_e2e_dv360_phone_001'

const FAILURE_HINT =
  'Needs E2E_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET,REFRESH_TOKEN,ADVERTISER_ID,APP_ID} and ' +
  'ACTIONS_FIRST_PARTY_DV360_{CLIENT_ID,CLIENT_SECRET}. The refresh token must carry the display-video ' +
  'scope and reach the advertiser: the copy in the secret store has expired, so read a live one from ' +
  'the oauth row of a staging destination instance.'

const ADVERTISER_ID = process.env.E2E_FIRST_PARTY_DV360_ADVERTISER_ID ?? ''

const mapping = defaultValues(syncAudience.fields)

// Display & Video 360 accepts any well formed digest and never reports whether it matched, so what
// these fixtures assert is the request the action built: the digest in `sent` is the digest of one
// exact string. A number which is dropped instead leaves its event with no identifier at all, which
// the action rejects before it reaches the API.
//
// The digests below, so a change to one is readable without rehashing it:
//   f222a66a… sha256('(212) 565-0000')   the raw value, unconverted
//   d360a79e… sha256('+12125650000')
//   4abe233a… sha256('020 7031 3000')    the raw value, unconverted
//   f3d7e96c… sha256('+442070313000')
//   36a2cef4… sha256('+14155550123')
//   0cc3d856… sha256('e2e-dv360-phone-keep@segment.com')
const RAW_US = 'f222a66a9502409bb412b042cf229861afe03554c9cb915d9a015210f1f08af5'
const E164_US = 'd360a79e746532a6a1e7b8164440b04cdd8797e23126f7a4de7a4b67fdcdba98'
const RAW_GB = '4abe233acce03d6d64c293f32e3d7a0e8a0cb8f733005827b5796437ef16b897'
const E164_GB = 'f3d7e96c73fb0de1b66acfce541d7af758fbd4f3fa3af0ea4e10110000d3625e'
const E164_US_MOBILE = '36a2cef4ff9bf7a1abd2a93359136b870393be4106e6c5d19b72ff564f9deca4'
const EMAIL_KEPT = '0cc3d8565dcd911ae2654d18ed9e5cc034637db7475a8e0e20eac3d549f95608'

// A local US number, and a London number whose leading 0 is a trunk prefix rather than part of the
// national number. '020 7031 3000' is only valid as a GB number: read as a US one it parses and
// fails validation, which is the case the per-user country exists for.
const US_LOCAL = '(212) 565-0000'
const GB_LOCAL = '020 7031 3000'

const phones = (...hashes: string[]) => ({
  advertiserId: ADVERTISER_ID,
  addedContactInfoList: { contactInfos: [{ hashedPhoneNumbers: hashes }] }
})

const audienceBody = { firstPartyAndPartnerAudienceId: '$externalAudienceId:contactInfo' }

// Dropping the only identifier an event had is the action's own rejection, reported per event
// rather than failing the batch.
const NO_IDENTIFIER_ERROR = { status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errorreporter: 'INTEGRATIONS' }

const event = (userId: string, phone: string, extraTraits: Record<string, string> = {}, email?: string) =>
  createE2EEngageAudienceEvent({
    type: 'track',
    action: 'add',
    eventName: 'Audience Entered',
    computationKey: COMPUTATION_KEY,
    computationId: COMPUTATION_ID,
    externalAudienceId: '$externalAudienceId:contactInfo',
    userId,
    ...(email ? { email } : {}),
    enrichedTraits: { phone, ...extraTraits }
  })

const fixtures: E2EFixture[] = [
  {
    // phone_options is left at its default, which is what an existing mapping has. Pairs with the
    // fixture below: same number in, a different digest out once normalization is turned on.
    description: 'Phone numbers: a local number is sent unconverted while normalization is off',
    subscribe: 'type = "track"',
    mapping,
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-default', US_LOCAL)],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200, sent: phones(RAW_US), body: audienceBody }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    description: 'Phone numbers: normalize converts a local number to E.164 using the default country',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: { normalization: PHONE_NORMALIZATION_NORMALIZE, defaultCountryCode: 'US' }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-normalize-us', US_LOCAL)],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200, sent: phones(E164_US), body: audienceBody }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The trunk prefix is dropped and the country code added, so '020 …' becomes '+4420 …'.
    description: 'Phone numbers: normalize strips a trunk prefix and adds the country code',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: { normalization: PHONE_NORMALIZATION_NORMALIZE, defaultCountryCode: 'GB' }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-normalize-gb', GB_LOCAL)],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200, sent: phones(E164_GB), body: audienceBody }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // A GB number read against US parses but is not a valid US number. Normalize sends exactly what
    // it was given rather than the '+1020 …' that conversion would have produced.
    description: 'Phone numbers: normalize sends a number it cannot convert exactly as mapped',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: { normalization: PHONE_NORMALIZATION_NORMALIZE, defaultCountryCode: 'US' }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-normalize-unconverted', GB_LOCAL)],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200, sent: phones(RAW_GB), body: audienceBody }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The same number and country as above, validating instead. Nothing is sent to the API: the
    // phone was the only identifier the event had.
    description: 'Phone numbers: normalize and validate drops a number it cannot convert',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: { normalization: PHONE_NORMALIZATION_VALIDATE, defaultCountryCode: 'US' }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-validate-dropped', GB_LOCAL)],
    expect: { status: 'success', jsonContains: [NO_IDENTIFIER_ERROR] },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // A dropped phone number takes the phone number with it and nothing else, so the user still
    // syncs on the email they were mapped with.
    description: 'Phone numbers: a dropped number leaves the rest of the member intact',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: { normalization: PHONE_NORMALIZATION_VALIDATE, defaultCountryCode: 'US' }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-keep-email', 'notaphone', {}, 'e2e-dv360-phone-keep@segment.com')],
    expect: {
      status: 'success',
      jsonContains: [
        {
          status: 200,
          sent: {
            advertiserId: ADVERTISER_ID,
            addedContactInfoList: { contactInfos: [{ hashedEmails: [EMAIL_KEPT] }] }
          },
          body: audienceBody
        }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The country on the user beats the default, which is the whole point of the toggle: one
    // mapping can carry users in several countries. The address group is incomplete, so the country
    // itself is not sent - it is only used to read the number.
    description: 'Phone numbers: the country from Contact Info Details is used ahead of the default',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: {
        normalization: PHONE_NORMALIZATION_VALIDATE,
        useContactInfoCountryCode: true,
        defaultCountryCode: 'US'
      }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-per-user-country', GB_LOCAL, { countryCode: 'GB' })],
    expect: {
      status: 'success',
      jsonContains: [{ status: 200, sent: phones(E164_GB), body: audienceBody }]
    },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The same event with the toggle off. The country on the user is ignored, the number is read
    // against the default and dropped, which is how the toggle is shown to be doing something.
    description: 'Phone numbers: the country from Contact Info Details is ignored while the toggle is off',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: {
        normalization: PHONE_NORMALIZATION_VALIDATE,
        useContactInfoCountryCode: false,
        defaultCountryCode: 'US'
      }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [event('e2e-dv360-phone-toggle-off', GB_LOCAL, { countryCode: 'GB' })],
    expect: { status: 'success', jsonContains: [NO_IDENTIFIER_ERROR] },
    verboseFailureHint: FAILURE_HINT
  },
  {
    // The middle event loses its only identifier to validation. The events either side of it still
    // sync, and all three keep the position they arrived in.
    description: 'Phone numbers: a dropped number in a batch does not disturb the events around it',
    subscribe: 'type = "track"',
    mapping: {
      ...mapping,
      phone_options: { normalization: PHONE_NORMALIZATION_VALIDATE, defaultCountryCode: 'US' }
    },
    mode: 'batchWithMultistatus',
    audience: 'contactInfo',
    events: [
      event('e2e-dv360-phone-batch-1', US_LOCAL),
      event('e2e-dv360-phone-batch-2', GB_LOCAL),
      event('e2e-dv360-phone-batch-3', '+1 (415) 555-0123')
    ],
    expect: {
      status: 'success',
      jsonContains: [
        { status: 200, sent: phones(E164_US), body: audienceBody },
        NO_IDENTIFIER_ERROR,
        { status: 200, sent: phones(E164_US_MOBILE), body: audienceBody }
      ]
    },
    verboseFailureHint: FAILURE_HINT
  }
]

export default fixtures
