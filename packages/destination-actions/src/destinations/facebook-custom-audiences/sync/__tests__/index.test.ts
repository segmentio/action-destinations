import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../fbca-operations'
import nock from 'nock'
import { SCHEMA_PROPERTIES } from '../../fbca-properties'
import { createHash } from 'crypto'

// clone of the hash function in fbca-operations.ts since it's a private method
const hash = (value: string): string => {
  return createHash('sha256').update(value).digest('hex')
}

const testDestination = createTestIntegration(Destination)
const auth = {
  accessToken: '123',
  refreshToken: '321'
}
const EMPTY = ''

describe('FacebookCustomAudiences.sync', () => {
  describe('RETL', () => {
    const retlSettings = {
      retlAdAccountId: '123'
    }

    const hookOutputs = {
      audienceName: 'user-created-audience',
      audienceId: '900'
    }

    const event = createTestEvent({
      properties: {
        id: '1234',
        created_at: '2021-01-01T00:00:00.000Z',
        industry: 'Tech',
        phone: '555-555-5555',
        state: 'CA',
        city: 'San Francisco',
        annual_revenue: 1000000,
        account_id: '1234',
        zip_code: '92000',
        address: '123 Main St'
      }
    })

    it('should sync a single user', async () => {
      nock(`${BASE_URL}`)
        .post(`/${hookOutputs.audienceId}/users`, {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              [
                hash((event.properties?.id as string) || ''), // external_id
                EMPTY, // email
                hash((event.properties?.phone as string) || ''), // phone
                EMPTY, // gender
                EMPTY, // year
                EMPTY, // month
                EMPTY, // day
                EMPTY, // last_name
                EMPTY, // first_name
                EMPTY, // first_initial
                hash((event.properties?.city as string) || ''), // city
                hash((event.properties?.state as string) || ''), // state
                hash((event.properties?.zip_code as string) || ''), // zip
                EMPTY, // mobile_advertiser_id,
                hash('US') // country
              ]
            ]
          }
        })
        .reply(200, { test: 'test' })

      const responses = await testDestination.testAction('sync', {
        event,
        settings: retlSettings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'add',
          phone: { '@path': '$.properties.phone' },
          address: {
            city: { '@path': '$.properties.city' },
            state: { '@path': '$.properties.state' },
            zip: { '@path': '$.properties.zip_code' },
            country: 'US'
          },
          externalId: { '@path': '$.properties.id' },
          retlOnMappingSave: {
            inputs: {},
            outputs: hookOutputs
          },
          enable_batching: true,
          batch_size: 10000
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer 123",
            ],
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"payload\\":{\\"schema\\":[\\"EXTERN_ID\\",\\"EMAIL\\",\\"PHONE\\",\\"GEN\\",\\"DOBY\\",\\"DOBM\\",\\"DOBD\\",\\"LN\\",\\"FN\\",\\"FI\\",\\"CT\\",\\"ST\\",\\"ZIP\\",\\"MADID\\",\\"COUNTRY\\"],\\"data\\":[[\\"03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4\\",\\"\\",\\"89a0af94167fe6b92b614c681cc5599cd23ff45f7e9cc7929ed5fabe26842468\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"5aa34886f7f3741de8460690b636f4c8b7c2044df88e2e8adbb4f7e6f8534931\\",\\"4b650e5c4785025dee7bd65e3c5c527356717d7a1c0bfef5b4ada8ca1e9cbe17\\",\\"ad16c1a6866c5887c5b59c1803cb1fc09769f1b403b6f1d9d0f10ad6ab4d5d50\\",\\"\\",\\"9b202ecbc6d45c6d8901d989a918878397a3eb9d00e8f48022fc051b19d21a1d\\"]]}}"`
      )
    })

    it.skip('should delete a single user', async () => {})
  })
})
