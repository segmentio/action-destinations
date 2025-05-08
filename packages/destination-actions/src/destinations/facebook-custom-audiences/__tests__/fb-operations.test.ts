import createRequestClient from '../../../../../core/src/request-client'
import FacebookClient, { generateData } from '../fbca-operations'
import { Settings } from '../generated-types'
import nock from 'nock'
import { Payload } from '../sync/generated-types'
import { normalizationFunctions } from '../fbca-properties'
import { Features } from '@segment/actions-core/mapping-kit'
import { API_VERSION, BASE_URL, CANARY_API_VERSION } from '../constants'
import { processHashing } from '../../../lib/hashing-utils'

const requestClient = createRequestClient()
const settings: Settings = {
  retlAdAccountId: 'act_123456'
}
const EMPTY = ''

describe('Facebook Custom Audiences', () => {
  const features: Features = { 'facebook-custom-audience-actions-canary-version': true }
  // feature flag is set
  const canaryFacebookClient = new FacebookClient(requestClient, settings.retlAdAccountId, features)
  // feature flag is not set
  const defaultFacebookClient = new FacebookClient(requestClient, settings.retlAdAccountId, {})
  describe('retlOnMappingSave hook', () => {
    const hookInputs = {
      audienceName: 'test-audience'
    }

    it('should create a custom audience in facebook with CANARY_API_VERSION', async () => {
      nock(`${BASE_URL}/${CANARY_API_VERSION}/`)
        .post(`/${settings.retlAdAccountId}/customaudiences`, {
          name: hookInputs.audienceName,
          subtype: 'CUSTOM',
          customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
        })
        .reply(201, { id: '123' })

      await canaryFacebookClient.createAudience(hookInputs.audienceName)
    })

    it('should create a custom audience in facebook with default API_VERSION', async () => {
      nock(`${BASE_URL}/${API_VERSION}/`)
        .post(`/${settings.retlAdAccountId}/customaudiences`, {
          name: hookInputs.audienceName,
          subtype: 'CUSTOM',
          customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
        })
        .reply(201, { id: '123' })

      await defaultFacebookClient.createAudience(hookInputs.audienceName)
    })
  })

  describe('generateData', () => {
    it('should generate data correctly for a single user', async () => {
      const payloads: Payload[] = [
        {
          email: 'haaron@braves.com',
          phone: '555-555-5555',
          name: {
            first: 'Henry',
            last: 'Aaron'
          },
          externalId: '5',
          // Batching fields should be ignored when generating data
          enable_batching: true,
          batch_size: 10000
        }
      ]

      expect(generateData(payloads)).toEqual([
        [
          '5', // external_id is not hashed or normalized
          processHashing(payloads[0].email || '', 'sha256', 'hex', normalizationFunctions.get('email')),
          processHashing(payloads[0].phone || '', 'sha256', 'hex', normalizationFunctions.get('phone')),
          EMPTY, // gender
          EMPTY, // year
          EMPTY, // month
          EMPTY, // day
          processHashing(payloads[0].name?.last || '', 'sha256', 'hex', normalizationFunctions.get('last')),
          processHashing(payloads[0].name?.first || '', 'sha256', 'hex', normalizationFunctions.get('first')),
          EMPTY, // first_initial
          EMPTY, // city
          EMPTY, // state
          EMPTY, // zip
          EMPTY, // mobile_advertiser_id,
          EMPTY // country
        ]
      ])
    })

    it('should generate data correctly for multiple users', async () => {
      const payloads: Payload[] = new Array(2)

      payloads[0] = {
        email: 'haaron@braves.com',
        phone: '89a0af94167fe6b92b614c681cc5599cd23ff45f7e9cc7929ed5fabe26842468', // pre-hashed phone: 555-555-5555
        name: {
          first: 'Henry',
          last: 'Aaron'
        },
        externalId: '5',
        enable_batching: true,
        batch_size: 10000
      }

      payloads[1] = {
        externalId: '6',
        email: 'tony@padres.com',
        gender: 'male',
        birth: {
          year: '1960',
          month: 'May',
          day: '9'
        },
        name: {
          first: 'Tony',
          last: 'Gwynn',
          firstInitial: 'T'
        },
        city: 'San Diego',
        state: 'CA',
        zip: '92000',
        country: 'US',
        enable_batching: true,
        batch_size: 10000
      }

      expect(generateData(payloads)).toEqual([
        [
          '5', // external_id
          processHashing(payloads[0].email || '', 'sha256', 'hex', normalizationFunctions.get('email')),
          '89a0af94167fe6b92b614c681cc5599cd23ff45f7e9cc7929ed5fabe26842468',
          EMPTY, // gender
          EMPTY, // year
          EMPTY, // month
          EMPTY, // day
          processHashing(payloads[0].name?.last || '', 'sha256', 'hex', normalizationFunctions.get('last')),
          processHashing(payloads[0].name?.first || '', 'sha256', 'hex', normalizationFunctions.get('first')),
          EMPTY, // first_initial
          EMPTY, // city
          EMPTY, // state
          EMPTY, // zip
          EMPTY, // mobile_advertiser_id,
          EMPTY // country
        ],
        [
          '6', // external_id
          processHashing(payloads[1].email || '', 'sha256', 'hex', normalizationFunctions.get('email')),
          EMPTY, // phone
          processHashing(payloads[1].gender || '', 'sha256', 'hex', normalizationFunctions.get('gender')),
          processHashing(payloads[1].birth?.year || '', 'sha256', 'hex', normalizationFunctions.get('year')),
          processHashing(payloads[1].birth?.month || '', 'sha256', 'hex', normalizationFunctions.get('month')),
          processHashing(payloads[1].birth?.day || '', 'sha256', 'hex', normalizationFunctions.get('day')),
          processHashing(payloads[1].name?.last || '', 'sha256', 'hex', normalizationFunctions.get('last')),
          processHashing(payloads[1].name?.first || '', 'sha256', 'hex', normalizationFunctions.get('first')),
          processHashing(
            payloads[1].name?.firstInitial || '',
            'sha256',
            'hex',
            normalizationFunctions.get('firstInitial')
          ),
          processHashing(payloads[1].city || '', 'sha256', 'hex', normalizationFunctions.get('city')),
          processHashing(payloads[1].state || '', 'sha256', 'hex', normalizationFunctions.get('state')),
          processHashing(payloads[1].zip || '', 'sha256', 'hex', normalizationFunctions.get('zip')),
          EMPTY, // mobile_advertiser_id,
          processHashing(payloads[1].country || '', 'sha256', 'hex', normalizationFunctions.get('country'))
        ]
      ])
    })
  })

  describe('data normalization', () => {
    // Test cases derived from a CSV provided by Facebook
    // https://developers.facebook.com/docs/marketing-api/audiences/guides/custom-audiences#example_sha256

    const emails = [
      ['NICK@EMAIL.com', 'nick@email.com'],
      ['     John_Smith@gmail.com    ', 'john_smith@gmail.com'],
      ['someone@domain.com', 'someone@domain.com'],
      ['    SomeOne@domain.com  ', 'someone@domain.com']
    ]

    const phones = [
      ['+1 (616) 954-78 88', '16169547888'],
      ['1(650)123-4567', '16501234567'],
      ['+001 (616) 954-78 88', '16169547888'],
      ['01(650)123-4567', '16501234567'],
      ['4792813113', '4792813113'],
      ['3227352263', '3227352263']
    ]

    const genders = [
      ['male', 'm'],
      ['Male', 'm'],
      ['Boy', 'm'],
      ['M', 'm'],
      ['m', 'm'],
      ['Girl', 'f'],
      ['        Woman         ', 'f'],
      ['Female', 'f'],
      ['female', 'f']
    ]

    const years = [[' 2000 ', '2000']]
    const months = [
      [' January', '01'],
      ['October', '10'],
      [' 12 ', '12']
    ]

    const names = [
      ['John', 'john'],
      ["    Na'than-Boile    ", 'nathanboile'],
      ['정', '정'],
      ['Valéry', 'valéry'],
      ['Doe', 'doe'],
      ['    Doe-Doe    ', 'doedoe']
    ]

    const firstInitials = [['J', 'j', ' a ', 'a']]
    const cities = [
      ['London', 'london'],
      ['Menlo Park', 'menlopark'],
      ['    Menlo-Park  ', 'menlopark']
    ]
    const states = [
      ['    California.   ', 'california'],
      ['CA', 'ca'],
      ['  TE', 'te'],
      ['    C/a/lifo,rnia.  ', 'california']
    ]
    const zips = [
      ['37221', '37221'],
      ['37221-3312', '37221']
    ]
    const countries = [
      ['       United States       ', 'unitedstates'],
      ['       US       ', 'us']
    ]

    const dataTypes = new Map([
      ['email', emails],
      ['phone', phones],
      ['gender', genders],
      ['year', years],
      ['month', months],
      ['first', names],
      ['last', names],
      ['firstInitial', firstInitials],
      ['city', cities],
      ['state', states],
      ['zip', zips],
      ['country', countries]
    ])

    dataTypes.forEach((testExamples, dataType) => {
      describe(`should normalize ${dataType}`, () => {
        const normalizationFunction = normalizationFunctions.get(dataType)

        if (!normalizationFunction || typeof normalizationFunction !== 'function') {
          throw new Error(`Normalization function not found for ${dataType}`)
        }

        testExamples.forEach(([input, expected]) => {
          it(`should normalize ${input} to ${expected}`, async () => {
            try {
              expect(normalizationFunction(input)).toBe(expected)
            } catch (e) {
              throw new Error(`Failed for ${dataType} with input ${input}: ${e}`)
            }
          })
        })
      })
    })
  })
})
