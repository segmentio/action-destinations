import createRequestClient from '../../../../../core/src/request-client'
import FacebookClient, { BASE_URL, generateData } from '../fbca-operations'
import { Settings } from '../generated-types'
import nock from 'nock'
import { Payload } from '../sync/generated-types'
import { createHash } from 'crypto'

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
          hash(payloads[0].externalId || ''), // external_id
          hash(payloads[0].email || ''), // email
          hash(payloads[0].phone || ''), // phone
          EMPTY, // gender
          EMPTY, // year
          EMPTY, // month
          EMPTY, // day
          hash(payloads[0].name?.last || ''), // last_name
          hash(payloads[0].name?.first || ''), // first_name
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
        address: {
          city: 'San Diego',
          state: 'CA',
          zip: '92000',
          country: 'US'
        },
        enable_batching: true,
        batch_size: 10000
      }

      expect(generateData(payloads)).toEqual([
        [
          hash(payloads[0].externalId || ''), // external_id
          hash(payloads[0].email || ''), // email
          hash(payloads[0].phone || ''), // phone
          EMPTY, // gender
          EMPTY, // year
          EMPTY, // month
          EMPTY, // day
          hash(payloads[0].name?.last || ''), // last_name
          hash(payloads[0].name?.first || ''), // first_name
          EMPTY, // first_initial
          EMPTY, // city
          EMPTY, // state
          EMPTY, // zip
          EMPTY, // mobile_advertiser_id,
          EMPTY // country
        ],
        [
          EMPTY, // external_id
          hash(payloads[1].email || ''), // email
          EMPTY, // phone
          hash(payloads[1].gender || ''), // gender
          hash(payloads[1].birth?.year || ''), // year
          hash(payloads[1].birth?.month || ''), // month
          hash(payloads[1].birth?.day || ''), // day
          hash(payloads[1].name?.last || ''), // last_name
          hash(payloads[1].name?.first || ''), // first_name
          hash(payloads[1].name?.firstInitial || ''), // first_initial
          hash(payloads[1].address?.city || ''), // city
          hash(payloads[1].address?.state || ''), // state
          hash(payloads[1].address?.zip || ''), // zip
          EMPTY, // mobile_advertiser_id,
          hash(payloads[1].address?.country || '') // country
        ]
      ])
    })
  })
})
