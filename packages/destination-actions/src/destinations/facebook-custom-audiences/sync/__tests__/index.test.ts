import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'
import { SCHEMA_PROPERTIES } from '../../fbca-properties'
import { normalizationFunctions } from '../../fbca-properties'
import { BASE_URL, CANARY_API_VERSION, API_VERSION } from '../../constants'
import { processHashing } from '../../../../lib/hashing-utils'

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
        address: '123 Main St',
        email: '816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343', // pre-hashed email: nick@email.com
        appleIDFA: '2024'
      }
    })

    it('should sync a single user with a CANARY_API_VERSION', async () => {
      nock(`${BASE_URL}/${CANARY_API_VERSION}`)
        .post(`/${hookOutputs.audienceId}/users`, {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              [
                event.properties?.id, // external_id
                '816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343', // email
                processHashing(event.properties?.phone as string, 'sha256', 'hex', normalizationFunctions.get('phone')),
                EMPTY, // gender
                EMPTY, // year
                EMPTY, // month
                EMPTY, // day
                EMPTY, // last_name
                EMPTY, // first_name
                EMPTY, // first_initial
                processHashing(event.properties?.city as string, 'sha256', 'hex', normalizationFunctions.get('city')),
                processHashing(event.properties?.state as string, 'sha256', 'hex', normalizationFunctions.get('state')),
                processHashing(
                  (event.properties?.zip_code as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('zip')
                ),
                '2024', // mobile_advertiser_id,
                processHashing('US', 'sha256', 'hex', normalizationFunctions.get('country'))
              ]
            ],
            app_ids: ['2024']
          }
        })
        .reply(200, { test: 'test' })

      const responses = await testDestination.testAction('sync', {
        event,
        settings: retlSettings,
        auth,
        features: { 'facebook-custom-audience-actions-canary-version': true },
        mapping: {
          __segment_internal_sync_mode: 'upsert',
          email: { '@path': '$.properties.email' },
          phone: { '@path': '$.properties.phone' },
          city: { '@path': '$.properties.city' },
          state: { '@path': '$.properties.state' },
          zip: { '@path': '$.properties.zip_code' },
          country: 'US',
          externalId: { '@path': '$.properties.id' },
          appId: { '@path': '$.properties.appleIDFA' },
          mobileAdId: { '@path': '$.properties.appleIDFA' },
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
        `"{\\"payload\\":{\\"schema\\":[\\"EXTERN_ID\\",\\"EMAIL\\",\\"PHONE\\",\\"GEN\\",\\"DOBY\\",\\"DOBM\\",\\"DOBD\\",\\"LN\\",\\"FN\\",\\"FI\\",\\"CT\\",\\"ST\\",\\"ZIP\\",\\"MADID\\",\\"COUNTRY\\"],\\"data\\":[[\\"1234\\",\\"816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343\\",\\"a5ad7e6d5225ad00c5f05ddb6bb3b1597a843cc92f6cf188490ffcb88a1ef4ef\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac\\",\\"6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126\\",\\"ad16c1a6866c5887c5b59c1803cb1fc09769f1b403b6f1d9d0f10ad6ab4d5d50\\",\\"2024\\",\\"79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621\\"]],\\"app_ids\\":[\\"2024\\"]}}"`
      )
    })
    it('should sync a single user with a default API_VERSION', async () => {
      nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${hookOutputs.audienceId}/users`, {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              [
                event.properties?.id, // external_id
                '816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343', // email
                processHashing(
                  (event.properties?.phone as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('phone')
                ),
                EMPTY, // gender
                EMPTY, // year
                EMPTY, // month
                EMPTY, // day
                EMPTY, // last_name
                EMPTY, // first_name
                EMPTY, // first_initial
                processHashing(
                  (event.properties?.city as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('city')
                ),
                processHashing(
                  (event.properties?.state as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('state')
                ),
                processHashing(
                  (event.properties?.zip_code as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('zip')
                ),
                '2024', // mobile_advertiser_id,
                processHashing('US', 'sha256', 'hex', normalizationFunctions.get('country')) // country
              ]
            ],
            app_ids: ['2024']
          }
        })
        .reply(200, { test: 'test' })

      const responses = await testDestination.testAction('sync', {
        event,
        settings: retlSettings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'upsert',
          email: { '@path': '$.properties.email' },
          phone: { '@path': '$.properties.phone' },
          city: { '@path': '$.properties.city' },
          state: { '@path': '$.properties.state' },
          zip: { '@path': '$.properties.zip_code' },
          country: 'US',
          externalId: { '@path': '$.properties.id' },
          appId: { '@path': '$.properties.appleIDFA' },
          mobileAdId: { '@path': '$.properties.appleIDFA' },
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
        `"{\\"payload\\":{\\"schema\\":[\\"EXTERN_ID\\",\\"EMAIL\\",\\"PHONE\\",\\"GEN\\",\\"DOBY\\",\\"DOBM\\",\\"DOBD\\",\\"LN\\",\\"FN\\",\\"FI\\",\\"CT\\",\\"ST\\",\\"ZIP\\",\\"MADID\\",\\"COUNTRY\\"],\\"data\\":[[\\"1234\\",\\"816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343\\",\\"a5ad7e6d5225ad00c5f05ddb6bb3b1597a843cc92f6cf188490ffcb88a1ef4ef\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac\\",\\"6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126\\",\\"ad16c1a6866c5887c5b59c1803cb1fc09769f1b403b6f1d9d0f10ad6ab4d5d50\\",\\"2024\\",\\"79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621\\"]],\\"app_ids\\":[\\"2024\\"]}}"`
      )
    })

    it.skip('should delete a single user', async () => {})
  })

  describe('Engage', () => {
    const audienceSettings = {
      retlAdAccountId: '123'
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
        address: '123 Main St',
        email: '816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343', // pre-hashed email: nick@email.com
        appleIDFA: '2024'
      },
      context: {
        traits: {
          email: 'testing@testing.com'
        },
        personas: {
          external_audience_id: 1234
        }
      }
    })
    it('should sync with external_id from payload', async () => {
      nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${event.context?.personas.external_audience_id}/users`, {
          payload: {
            schema: SCHEMA_PROPERTIES,
            data: [
              [
                event.properties?.id, // external_id
                '816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343', // email
                processHashing(
                  (event.properties?.phone as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('phone')
                ),
                EMPTY, // gender
                EMPTY, // year
                EMPTY, // month
                EMPTY, // day
                EMPTY, // last_name
                EMPTY, // first_name
                EMPTY, // first_initial
                processHashing(
                  (event.properties?.city as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('city')
                ),
                processHashing(
                  (event.properties?.state as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('state')
                ),
                processHashing(
                  (event.properties?.zip_code as string) || '',
                  'sha256',
                  'hex',
                  normalizationFunctions.get('zip')
                ),
                '2024', // mobile_advertiser_id,
                processHashing('US', 'sha256', 'hex', normalizationFunctions.get('country')) // country
              ]
            ],
            app_ids: ['2024']
          }
        })
        .reply(200, { test: 'test' })

      const responses = await testDestination.testAction('sync', {
        event,
        settings: audienceSettings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'upsert',
          email: { '@path': '$.properties.email' },
          phone: { '@path': '$.properties.phone' },
          city: { '@path': '$.properties.city' },
          state: { '@path': '$.properties.state' },
          zip: { '@path': '$.properties.zip_code' },
          country: 'US',
          externalId: { '@path': '$.properties.id' },
          appId: { '@path': '$.properties.appleIDFA' },
          mobileAdId: { '@path': '$.properties.appleIDFA' },
          external_audience_id: '1234',
          retlOnMappingSave: {
            inputs: {},
            outputs: {}
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
        `"{\\"payload\\":{\\"schema\\":[\\"EXTERN_ID\\",\\"EMAIL\\",\\"PHONE\\",\\"GEN\\",\\"DOBY\\",\\"DOBM\\",\\"DOBD\\",\\"LN\\",\\"FN\\",\\"FI\\",\\"CT\\",\\"ST\\",\\"ZIP\\",\\"MADID\\",\\"COUNTRY\\"],\\"data\\":[[\\"1234\\",\\"816341caf0c06dbc4c156d3465323f52b3cb62533241d5f9247c008f657e8343\\",\\"a5ad7e6d5225ad00c5f05ddb6bb3b1597a843cc92f6cf188490ffcb88a1ef4ef\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"\\",\\"1a6bd4d9d79dc0a79b53795c70d3349fa9e38968a3fbefbfe8783efb1d2b6aac\\",\\"6959097001d10501ac7d54c0bdb8db61420f658f2922cc26e46d536119a31126\\",\\"ad16c1a6866c5887c5b59c1803cb1fc09769f1b403b6f1d9d0f10ad6ab4d5d50\\",\\"2024\\",\\"79adb2a2fce5c6ba215fe5f27f532d4e7edbac4b6a5e09e1ef3a08084a904621\\"]],\\"app_ids\\":[\\"2024\\"]}}"`
      )
    })
  })
})
