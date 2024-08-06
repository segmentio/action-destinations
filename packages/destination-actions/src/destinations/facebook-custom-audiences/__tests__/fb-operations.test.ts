import createRequestClient from '../../../../../core/src/request-client'
import FacebookClient, { BASE_URL, generateData } from '../fbca-operations'
import { Settings } from '../generated-types'
import nock from 'nock'
import { Payload } from '../sync/generated-types'
import { createHash } from 'crypto'
import { normalizationFunctions } from '../fbca-properties'

const requestClient = createRequestClient()
const settings: Settings = {
  retlAdAccountId: 'act_123456'
}
const EMPTY = ''

// clone of the hash function in fbca-operations.ts since it's a private method
const hash = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

describe('Facebook Custom Audiences', () => {
  const facebookClient = new FacebookClient(requestClient, settings.retlAdAccountId)
  describe('retlOnMappingSave hook', () => {
    const hookInputs = {
      audienceName: 'test-audience'
    }

    it('should create a custom audience in facebook', async () => {
      nock(`${BASE_URL}`)
        .post(`/${settings.retlAdAccountId}/customaudiences`, {
          name: hookInputs.audienceName,
          subtype: 'CUSTOM',
          customer_file_source: 'BOTH_USER_AND_PARTNER_PROVIDED'
        })
        .reply(201, { id: '123' })

      await facebookClient.createAudience(hookInputs.audienceName)
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
          hash(normalizationFunctions.get('email')!(payloads[0].email || '')), // email
          hash(normalizationFunctions.get('phone')!(payloads[0].phone || '')), // phone
          EMPTY, // gender
          EMPTY, // year
          EMPTY, // month
          EMPTY, // day
          hash(normalizationFunctions.get('last')!(payloads[0].name?.last || '')), // last_name
          hash(normalizationFunctions.get('first')!(payloads[0].name?.first || '')), // first_name
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
        phone: '555-555-5555',
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
          hash(normalizationFunctions.get('email')!(payloads[0].email || '')),
          hash(normalizationFunctions.get('phone')!(payloads[0].phone || '')),
          EMPTY, // gender
          EMPTY, // year
          EMPTY, // month
          EMPTY, // day
          hash(normalizationFunctions.get('last')!(payloads[0].name?.last || '')),
          hash(normalizationFunctions.get('first')!(payloads[0].name?.first || '')),
          EMPTY, // first_initial
          EMPTY, // city
          EMPTY, // state
          EMPTY, // zip
          EMPTY, // mobile_advertiser_id,
          EMPTY // country
        ],
        [
          '6', // external_id
          hash(normalizationFunctions.get('email')!(payloads[1].email || '')),
          EMPTY, // phone
          hash(normalizationFunctions.get('gender')!(payloads[1].gender || '')),
          hash(normalizationFunctions.get('year')!(payloads[1].birth?.year || '')),
          hash(normalizationFunctions.get('month')!(payloads[1].birth?.month || '')),
          hash(normalizationFunctions.get('day')!(payloads[1].birth?.day || '')),
          hash(normalizationFunctions.get('last')!(payloads[1].name?.last || '')),
          hash(normalizationFunctions.get('first')!(payloads[1].name?.first || '')),
          hash(normalizationFunctions.get('firstInitial')!(payloads[1].name?.firstInitial || '')),
          hash(normalizationFunctions.get('city')!(payloads[1].city || '')),
          hash(normalizationFunctions.get('state')!(payloads[1].state || '')),
          hash(normalizationFunctions.get('zip')!(payloads[1].zip || '')),
          EMPTY, // mobile_advertiser_id,
          hash(normalizationFunctions.get('country')!(payloads[1].country || ''))
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
