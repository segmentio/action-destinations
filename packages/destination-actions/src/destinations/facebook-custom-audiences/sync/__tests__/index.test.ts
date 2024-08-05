import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { BASE_URL } from '../../fbca-operations'
import nock from 'nock'
import { SCHEMA_PROPERTIES } from '../../fbca-properties'
import { createHash } from 'crypto'
import { normalizationFunctions } from '../../fbca-properties'
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
                event.properties?.id, // external_id
                EMPTY, // email
                hash(normalizationFunctions.get('phone')!((event.properties?.phone as string) || '')),
                EMPTY, // gender
                EMPTY, // year
                EMPTY, // month
                EMPTY, // day
                EMPTY, // last_name
                EMPTY, // first_name
                EMPTY, // first_initial
                hash(normalizationFunctions.get('city')!((event.properties?.city as string) || '')),
                hash(normalizationFunctions.get('state')!((event.properties?.state as string) || '')),
                hash(normalizationFunctions.get('zip')!((event.properties?.zip_code as string) || '')),
                EMPTY, // mobile_advertiser_id,
                hash(normalizationFunctions.get('country')!('US'))
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
          __segment_internal_sync_mode: 'upsert',
          phone: { '@path': '$.properties.phone' },
          city: { '@path': '$.properties.city' },
          state: { '@path': '$.properties.state' },
          zip: { '@path': '$.properties.zip_code' },
          country: 'US',
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
        `"{\\"payload\\":{\\"schema\\":[\\"EXTERN_ID\\",\\"EMAIL\\",\\"PHONE\\",\\"GEN\\",\\"DOBY\\",\\"DOBM\\",\\"DOBD\\",\\"LN\\",\\"FN\\",\\"FI\\",\\"CT\\",\\"ST\\",\\"ZIP\\",\\"MADID\\",\\"COUNTRY\\"],\\"data\\":[[\\"1234\\",\\"\\",\\"a5ad7e6d5225ad00c5f05ddb6bb3b1597a843cc92f6cf188490ffcb88a1ef4ef\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac\\",\\"6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126\\",\\"ad16c1a6866c5887c5b59c1803cb1fc09769f1b403b6f1d9d0f10ad6ab4d5d50\\",\\"\\",\\"79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621\\"]]}}"`
      )
    })

    it.skip('should delete a single user', async () => {})
  })
})
