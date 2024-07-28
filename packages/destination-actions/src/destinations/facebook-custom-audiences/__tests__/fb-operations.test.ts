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
          externalId: '5'
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

    it('should generate data correctly for multiple users', async () => {})
  })
})
