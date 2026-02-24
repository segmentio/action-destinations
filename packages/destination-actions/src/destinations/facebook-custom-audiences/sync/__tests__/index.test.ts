import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'
import { SCHEMA_PROPERTIES } from '../constants'
import { normalizationFunctions } from '../functions'
import { API_VERSION, BASE_URL } from '../../constants'
import { processHashing } from '../../../../lib/hashing-utils'

let testDestination = createTestIntegration(Destination)
const auth = {
  accessToken: '123',
  refreshToken: '321'
}
const EMPTY = ''

describe('FacebookCustomAudiences.sync', () => {
  beforeEach(() => {
    testDestination = createTestIntegration(Destination)
  })
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

    it('should sync a single user', async () => {
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
          __segment_internal_sync_mode: 'mirror',
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

    it('should handle Facebook API error for flagged audience without throwing 500', async () => {
      // https://developers.facebook.com/docs/marketing-api/reference/custom-audience/#flagged
      const facebookError = {
        error: {
          message: 'Invalid parameter',
          code: 100,
          error_subcode: 1713231,
          error_user_title: 'Update Restricted Fields and Rule',
          error_user_msg:
            'This custom audience has integrity restrictions. To continue, you must update the restricted fields and the rule in your current edit'
        }
      }

      nock(`${BASE_URL}/${API_VERSION}`)
        .post(`/${event.context?.personas.external_audience_id}/users`)
        .reply(400, facebookError)

      await expect(
        testDestination.testAction('sync', {
          event,
          settings: audienceSettings,
          auth,
          mapping: {
            __segment_internal_sync_mode: 'mirror',
            email: { '@path': '$.properties.email' },
            phone: { '@path': '$.properties.phone' },
            externalId: { '@path': '$.properties.id' },
            external_audience_id: '1234',
            retlOnMappingSave: {
              inputs: {},
              outputs: {}
            },
            enable_batching: true,
            batch_size: 10000
          }
        })
      ).rejects.toMatchObject({
        response: {
          status: 400,
          data: facebookError
        }
      })
    })
  })

  describe('executeBatch', () => {
    const AUDIENCE_ID = '900'

    const retlSettings = {
      retlAdAccountId: '123'
    }

    const hookOutputs = {
      audienceName: 'test-audience',
      audienceId: AUDIENCE_ID
    }

    const retlMapping = {
      __segment_internal_sync_mode: 'mirror',
      email: { '@path': '$.properties.email' },
      externalId: { '@path': '$.userId' },
      retlOnMappingSave: {
        inputs: {},
        outputs: hookOutputs
      },
      enable_batching: true,
      batch_size: 10000
    }
    // The tests here only include externalId and email. 
    // We pad the data with 13 empty strings for the other PII values we are not testing with 
    const EMPTY_DATA_ROW = ['', '', '', '', '', '', '', '', '', '', '', '', '']

    it('should return a separate response for each event in a batch upsert', async () => {
      const events = [
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } })
      ]

      nock(`${BASE_URL}/${API_VERSION}`).post(`/${AUDIENCE_ID}/users`).reply(200, {})

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings: retlSettings,
        auth,
        mapping: retlMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        body: { email: 'user1@example.com', externalId: 'user-1', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_DATA_ROW]
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        body: { email: 'user2@example.com', externalId: 'user-2', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_DATA_ROW]
        }
      })
    })

    it('should return a separate response for each event in a batch delete', async () => {
      const events = [
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } })
      ]

      nock(`${BASE_URL}/${API_VERSION}`).delete(`/${AUDIENCE_ID}/users`).reply(200, {})

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings: retlSettings,
        auth,
        mapping: { ...retlMapping, __segment_internal_sync_mode: 'mirror' }
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        body: { email: 'user1@example.com', externalId: 'user-1', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'DELETE',
          data: ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_DATA_ROW]
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        body: { email: 'user2@example.com', externalId: 'user-2', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'DELETE',
          data: ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_DATA_ROW]
        }
      })
    })

    it('should return a separate response for each event in an Engage batch with adds and removes', async () => {
      const audienceKey = 'fb_audience'
      const engageAudienceId = '1234'

      const engageMapping = {
        email: { '@path': '$.traits.email' },
        externalId: { '@path': '$.userId' },
        external_audience_id: engageAudienceId,
        engage_fields: {
          traits_or_properties: { '@path': '$.traits' },
          audience_key: { '@path': '$.context.personas.computation_key' },
          computation_class: { '@path': '$.context.personas.computation_class' }
        },
        retlOnMappingSave: { inputs: {}, outputs: {} },
        enable_batching: true,
        batch_size: 10000
      }

      const makeEngageEvent = (email: string, id: string, isMember: boolean) =>
        createTestEvent({
          type: 'identify',
          userId: id,
          traits: { email, [audienceKey]: isMember },
          context: {
            personas: {
              external_audience_id: engageAudienceId,
              computation_class: 'audience',
              computation_key: audienceKey
            }
          }
        })

      const events = [
        makeEngageEvent('add1@example.com', 'add-1', true),
        makeEngageEvent('add2@example.com', 'add-2', true),
        makeEngageEvent('remove1@example.com', 'rm-1', false),
        makeEngageEvent('remove2@example.com', 'rm-2', false)
      ]

      nock(`${BASE_URL}/${API_VERSION}`).post(`/${engageAudienceId}/users`).reply(200, {})
      nock(`${BASE_URL}/${API_VERSION}`).delete(`/${engageAudienceId}/users`).reply(200, {})

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings: retlSettings,
        auth,
        mapping: engageMapping
      })

      expect(responses.length).toBe(4)
      expect(responses[0]).toMatchObject({
        status: 200,
        body: {
          email: 'add1@example.com',
          externalId: 'add-1',
          external_audience_id: engageAudienceId,
          engage_fields: {
            traits_or_properties: { email: 'add1@example.com', [audienceKey]: true },
            audience_key: audienceKey,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: engageAudienceId,
          method: 'POST',
          data: ['add-1', 'aa1db121880f3e1244980661c1e57703737003ae0b8337796c43b0acf935aa06', ...EMPTY_DATA_ROW]
        }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        body: {
          email: 'add2@example.com',
          externalId: 'add-2',
          engage_fields: {
            traits_or_properties: { email: 'add2@example.com', [audienceKey]: true },
            audience_key: audienceKey,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: engageAudienceId,
          method: 'POST',
          data: ['add-2', '0a5cf089b3b6f5bfc0ef42079b958d1693769288198e606dee14754ff1cbf6b6', ...EMPTY_DATA_ROW]
        }
      })
      expect(responses[2]).toMatchObject({
        status: 200,
        body: {
          email: 'remove1@example.com',
          externalId: 'rm-1',
          engage_fields: {
            traits_or_properties: { email: 'remove1@example.com', [audienceKey]: false },
            audience_key: audienceKey,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: engageAudienceId,
          method: 'DELETE',
          data: ['rm-1', 'b791d307cba8bd39bc5e17202a9f40553286cb0b13b3dddbaa85d76ec02f5a31', ...EMPTY_DATA_ROW]
        }
      })
      expect(responses[3]).toMatchObject({
        status: 200,
        body: {
          email: 'remove2@example.com',
          externalId: 'rm-2',
          engage_fields: {
            traits_or_properties: { email: 'remove2@example.com', [audienceKey]: false },
            audience_key: audienceKey,
            computation_class: 'audience'
          }
        },
        sent: {
          audienceId: engageAudienceId,
          method: 'DELETE',
          data: ['rm-2', '5afcb7e97117fe9675a1b542ee70bbcb74dc4202f40139b7c7ec763c65b76ac9', ...EMPTY_DATA_ROW]
        }
      })
    })

    it('should return a separate response for each event in a large batch', async () => {
      const emailHashes = [
        'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', // user1@example.com
        '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', // user2@example.com
        '898628e28890f937bdf009391def42879c401a4bcf1b5fd24e738d9f5da8cbbb', // user3@example.com
        '40d71d3f998c168e7a254e75c0a1020185cfc67ab52790be92502835953fc41d', // user4@example.com
        '4d8f4dd97e0c7b6fed6367bed08adc1fe2c7f6d22fc76f46d63c674c10e4d062', // user5@example.com
        'b430419a8a3fa1ce5cafd92d89fe3e832b39b1f1cab0f351c1b270b585d5eded', // user6@example.com
        '38121022af9b425b5dbf9b56823cf14183bd617022a8bc39a5843c9d7035d039', // user7@example.com
        '675657c179a97bde8a8cb572bfe434126b57311f5e9b49171855c5b6d0952dc5', // user8@example.com
        'b1e700bec7b4c7c386a589aa095a87af1792fe4b7b95c011e52e6f73327b098e', // user9@example.com
        '1cc95683bbb5c48117e33ef95a500d2224f8c0df2e32b608622b51db69956982'  // user10@example.com
      ]

      const events = Array.from({ length: 10 }, (_, i) =>
        createTestEvent({ userId: `user-${i + 1}`, properties: { email: `user${i + 1}@example.com` } })
      )

      nock(`${BASE_URL}/${API_VERSION}`).post(`/${AUDIENCE_ID}/users`).reply(200, {})

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings: retlSettings,
        auth,
        mapping: retlMapping
      })

      expect(responses.length).toBe(10)
      for (let i = 0; i < 10; i++) {
        expect(responses[i]).toMatchObject({
          status: 200,
          body: { email: `user${i + 1}@example.com`, externalId: `user-${i + 1}`, enable_batching: true, batch_size: 10000 },
          sent: {
            audienceId: AUDIENCE_ID,
            method: 'POST',
            data: [`user-${i + 1}`, emailHashes[i], ...EMPTY_DATA_ROW]
          }
        })
      }
    })

    it('should return an error response for each event when the Facebook API returns an error', async () => {
      const events = [
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } })
      ]

      const facebookError = {
        error: { message: 'Invalid parameter', code: 100, type: 'OAuthException' }
      }

      nock(`${BASE_URL}/${API_VERSION}`).post(`/${AUDIENCE_ID}/users`).reply(400, facebookError)

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings: retlSettings,
        auth,
        mapping: retlMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'OAuthException',
        errormessage: 'Invalid parameter (code: 100)',
        body: { email: 'user1@example.com', externalId: 'user-1', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-1', 'b36a83701f1c3191e19722d6f90274bc1b5501fe69ebf33313e440fe4b0fe210', ...EMPTY_DATA_ROW]
        }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'OAuthException',
        errormessage: 'Invalid parameter (code: 100)',
        body: { email: 'user2@example.com', externalId: 'user-2', enable_batching: true, batch_size: 10000 },
        sent: {
          audienceId: AUDIENCE_ID,
          method: 'POST',
          data: ['user-2', '2b3b2b9ce842ab8b6a6c614cb1f9604bb8a0d502d1af49c526b72b10894e95b5', ...EMPTY_DATA_ROW]
        }
      })
    })

    it('should return a 400 error response for each event when audience ID is missing', async () => {
      const events = [
        createTestEvent({ userId: 'user-1', properties: { email: 'user1@example.com' } }),
        createTestEvent({ userId: 'user-2', properties: { email: 'user2@example.com' } })
      ]

      const responses = await testDestination.executeBatch('sync', {
        events,
        settings: retlSettings,
        auth,
        mapping: {
          __segment_internal_sync_mode: 'mirror',
          email: { '@path': '$.properties.email' },
          externalId: { '@path': '$.userId' },
          retlOnMappingSave: { inputs: {}, outputs: {} },
          enable_batching: true,
          batch_size: 10000
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Missing audience ID.',
        body: { email: 'user1@example.com', externalId: 'user-1', enable_batching: true, batch_size: 10000 }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Missing audience ID.',
        body: { email: 'user2@example.com', externalId: 'user-2', enable_batching: true, batch_size: 10000 }
      })
    })
  })
})
