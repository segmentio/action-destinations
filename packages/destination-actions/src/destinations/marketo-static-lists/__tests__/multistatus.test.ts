import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import MarketoStaticList from '../index'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(MarketoStaticList)

const settings = {
  folder_name: 'Test',
  api_endpoint: 'https://000-ABC-123.mktorest.com',
  client_id: 'abc00000-1234-56a7-890f-a12b4456c789',
  client_secret: 'client-secret'
}

describe('MultiStatus', () => {
  describe('addToList', () => {
    const mapping = {
      event_name: {
        '@path': '$.event'
      },
      external_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      lookup_field: 'email',
      data: {
        email: {
          '@if': {
            exists: {
              '@path': '$.context.traits.email'
            },
            then: {
              '@path': '$.context.traits.email'
            },
            else: {
              '@path': '$.properties.email'
            }
          }
        }
      },
      enable_batching: true,
      batch_size: 10000
    }

    const events: SegmentEvent[] = [
      createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        anonymousId: '04618777717597463653257185356814720321',
        messageId: 'api-2PglAN7SNoZT2a0A70Yqxu0pSpW',
        properties: {
          email: 'test1@example.org'
        },
        context: {
          personas: {
            external_audience_id: '101'
          }
        },
        receivedAt: '2023-05-12T10:14:19.750Z',
        timestamp: '2023-05-12T10:14:06.946Z',
        userId: '0001'
      }),
      createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        anonymousId: '04618777717597463653257185356814720321',
        messageId: 'api-2PglAN7SNoZT2a0A70Yqxu0pSpW',
        properties: {
          email: 'test2@example.org'
        },
        context: {
          personas: {
            external_audience_id: '101'
          }
        },
        receivedAt: '2023-05-12T10:14:19.750Z',
        timestamp: '2023-05-12T10:14:06.946Z',
        userId: '0002'
      })
    ]

    it('should throw error for invalid access token', async () => {
      nock(settings.api_endpoint)
        .post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [
            {
              code: '601',
              message: 'Access token invalid'
            }
          ]
        })

      const response = testDestination.executeBatch('addToList', {
        events,
        settings,
        mapping
      })

      await expect(response).rejects.toThrowError('Access token invalid')
    })
    it('should throw INVALID_AUTHENTICATION error for invalid access token (single event)', async () => {
      nock(settings.api_endpoint)
        .post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [
            {
              code: '601',
              message: 'Access token invalid'
            }
          ]
        })

      await expect(
        testDestination.testAction('addToList', {
          event: events[0],
          settings,
          mapping
        })
      ).rejects.toThrowError('Access token invalid')
    })

    it('should throw BAD_REQUEST error for known non-retryable error code (single event)', async () => {
      nock(settings.api_endpoint)
        .post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [{ code: '1013', message: 'Static list not found' }]
        })

      await expect(
        testDestination.testAction('addToList', {
          event: events[0],
          settings,
          mapping
        })
      ).rejects.toThrowError('Static list not found')
    })

    it.each([
      '603',
      '605',
      '609',
      '610',
      '612',
      '613',
      '616',
      '701',
      '702',
      '703',
      '704',
      '709',
      '710',
      '711',
      '712',
      '714',
      '718',
      '1001',
      '1002',
      '1003',
      '1004',
      '1005',
      '1006',
      '1007',
      '1008',
      '1009',
      '1010',
      '1011',
      '1012',
      '1013',
      '1014',
      '1015',
      '1017',
      '1018',
      '1021',
      '1022',
      '1025',
      '1026',
      '1027',
      '1028',
      '1035',
      '1036',
      '1037',
      '1042',
      '1048',
      '1049',
      '1076',
      '1077',
      '1078',
      '1079'
    ])('should return non-retryable multistatus for known non-retryable error code %s', async (code) => {
      nock(settings.api_endpoint)
        .post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [{ code, message: `Non-retryable error ${code}` }]
        })

      const response = await testDestination.executeBatch('addToList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: `Non-retryable error ${code}`,
          errorreporter: 'DESTINATION',
          body: { code, message: `Non-retryable error ${code}` }
        },
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: `Non-retryable error ${code}`,
          errorreporter: 'DESTINATION',
          body: { code, message: `Non-retryable error ${code}` }
        }
      ])
    })

    it('should return retryable multistatus for unknown/future error codes', async () => {
      nock(settings.api_endpoint)
        .post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [{ code: '9999', message: 'Unknown future error' }]
        })

      const response = await testDestination.executeBatch('addToList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 500,
          errortype: 'RETRYABLE_ERROR',
          errormessage: 'Unknown future error',
          errorreporter: 'DESTINATION',
          body: { code: '9999', message: 'Unknown future error' }
        },
        {
          status: 500,
          errortype: 'RETRYABLE_ERROR',
          errormessage: 'Unknown future error',
          errorreporter: 'DESTINATION',
          body: { code: '9999', message: 'Unknown future error' }
        }
      ])
    })

    it.each([{ errors: [] }, {}])(
      'should return retryable multistatus when response has no error details',
      async (errorBody) => {
        nock(settings.api_endpoint)
          .post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email')
          .reply(200, {
            requestId: '0001#1234f2f3e4',
            success: false,
            warnings: [],
            ...errorBody
          })

        const response = await testDestination.executeBatch('addToList', {
          events,
          settings,
          mapping
        })

        expect(response).toMatchObject([
          {
            status: 500,
            errortype: 'UNKNOWN_ERROR',
            errorreporter: 'INTEGRATIONS'
          },
          {
            status: 500,
            errortype: 'UNKNOWN_ERROR',
            errorreporter: 'INTEGRATIONS'
          }
        ])
      }
    )

    it('should return multistatus for success', async () => {
      nock(settings.api_endpoint).post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email').reply(200, {
        requestId: '0001#1234f2f3e4',
        success: true,
        warnings: [],
        errors: []
      })

      const response = await testDestination.executeBatch('addToList', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        body: {
          requestId: '0001#1234f2f3e4',
          success: true,
          warnings: [],
          errors: []
        },
        sent: 'test1@example.org'
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: {
          requestId: '0001#1234f2f3e4',
          success: true,
          warnings: [],
          errors: []
        },
        sent: 'test2@example.org'
      })
    })
  })

  describe('removeFromList', () => {
    const mapping = {
      event_name: {
        '@path': '$.event'
      },
      external_id: {
        '@path': '$.context.personas.external_audience_id'
      },
      lookup_field: 'email',
      field_value: {
        '@if': {
          exists: { '@path': '$.context.traits.email' },
          then: { '@path': '$.context.traits.email' },
          else: { '@path': '$.properties.email' }
        }
      },
      enable_batching: true,
      batch_size: 100
    }

    const events: SegmentEvent[] = [
      createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        anonymousId: '04618777717597463653257185356814720321',
        messageId: 'api-2PglAN7SNoZT2a0A70Yqxu0pSpW',
        properties: {
          email: 'test1@example.org'
        },
        context: {
          personas: {
            external_audience_id: '101'
          }
        },
        receivedAt: '2023-05-12T10:14:19.750Z',
        timestamp: '2023-05-12T10:14:06.946Z',
        userId: '0001'
      }),
      createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        anonymousId: '04618777717597463653257185356814720321',
        messageId: 'api-2PglAN7SNoZT2a0A70Yqxu0pSpW',
        properties: {
          email: 'test2@example.org'
        },
        context: {
          personas: {
            external_audience_id: '101'
          }
        },
        receivedAt: '2023-05-12T10:14:19.750Z',
        timestamp: '2023-05-12T10:14:06.946Z',
        userId: '0002'
      })
    ]

    it('should throw error for invalid access token', async () => {
      nock(settings.api_endpoint)
        .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [
            {
              code: '601',
              message: 'Access token invalid'
            }
          ]
        })

      const response = testDestination.executeBatch('removeFromList', {
        events,
        settings,
        mapping
      })

      await expect(response).rejects.toThrowError('Access token invalid')
    })

    it.each([
      '603',
      '605',
      '609',
      '610',
      '612',
      '613',
      '616',
      '701',
      '702',
      '703',
      '704',
      '709',
      '710',
      '711',
      '712',
      '714',
      '718',
      '1004',
      '1007',
      '1008',
      '1009',
      '1010',
      '1013',
      '1017',
      '1027',
      '1036'
    ])('should return non-retryable multistatus for known non-retryable error code %s on getLeads', async (code) => {
      nock(settings.api_endpoint)
        .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [{ code, message: `Non-retryable error ${code}` }]
        })

      const response = await testDestination.executeBatch('removeFromList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: `Non-retryable error ${code}`,
          errorreporter: 'DESTINATION',
          body: { code, message: `Non-retryable error ${code}` }
        },
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: `Non-retryable error ${code}`,
          errorreporter: 'DESTINATION',
          body: { code, message: `Non-retryable error ${code}` }
        }
      ])
    })

    it.each([
      '603',
      '605',
      '609',
      '610',
      '612',
      '613',
      '616',
      '701',
      '702',
      '703',
      '704',
      '709',
      '710',
      '711',
      '712',
      '714',
      '718',
      '1004',
      '1007',
      '1008',
      '1009',
      '1010',
      '1013',
      '1017',
      '1027',
      '1036'
    ])('should return non-retryable multistatus for known non-retryable error code %s on deleteLeads', async (code) => {
      nock(settings.api_endpoint)
        .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: true,
          warnings: [],
          errors: [],
          result: [{ id: 1 }, { id: 2 }]
        })

      nock(settings.api_endpoint)
        .delete('/rest/v1/lists/101/leads.json?id=1,2')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [{ code, message: `Non-retryable error ${code}` }]
        })

      const response = await testDestination.executeBatch('removeFromList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: `Non-retryable error ${code}`,
          errorreporter: 'DESTINATION',
          body: { code, message: `Non-retryable error ${code}` }
        },
        {
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: `Non-retryable error ${code}`,
          errorreporter: 'DESTINATION',
          body: { code, message: `Non-retryable error ${code}` }
        }
      ])
    })

    it('should return retryable multistatus for unknown/future error codes on getLeads', async () => {
      nock(settings.api_endpoint)
        .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [{ code: '9999', message: 'Unknown future error' }]
        })

      const response = await testDestination.executeBatch('removeFromList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 500,
          errortype: 'RETRYABLE_ERROR',
          errormessage: 'Unknown future error',
          errorreporter: 'DESTINATION',
          body: { code: '9999', message: 'Unknown future error' }
        },
        {
          status: 500,
          errortype: 'RETRYABLE_ERROR',
          errormessage: 'Unknown future error',
          errorreporter: 'DESTINATION',
          body: { code: '9999', message: 'Unknown future error' }
        }
      ])
    })

    it('should return retryable multistatus for unknown/future error codes on deleteLeads', async () => {
      nock(settings.api_endpoint)
        .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: true,
          warnings: [],
          errors: [],
          result: [{ id: 1 }, { id: 2 }]
        })

      nock(settings.api_endpoint)
        .delete('/rest/v1/lists/101/leads.json?id=1,2')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [{ code: '9999', message: 'Unknown future error' }]
        })

      const response = await testDestination.executeBatch('removeFromList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 500,
          errortype: 'RETRYABLE_ERROR',
          errormessage: 'Unknown future error',
          errorreporter: 'DESTINATION',
          body: { code: '9999', message: 'Unknown future error' }
        },
        {
          status: 500,
          errortype: 'RETRYABLE_ERROR',
          errormessage: 'Unknown future error',
          errorreporter: 'DESTINATION',
          body: { code: '9999', message: 'Unknown future error' }
        }
      ])
    })

    it.each([{ errors: [] }, {}])(
      'should return retryable multistatus when getLeads response has no error details',
      async (errorBody) => {
        nock(settings.api_endpoint)
          .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
          .reply(200, {
            requestId: '0001#1234f2f3e4',
            success: false,
            warnings: [],
            ...errorBody
          })

        const response = await testDestination.executeBatch('removeFromList', {
          events,
          settings,
          mapping
        })

        expect(response).toMatchObject([
          {
            status: 500,
            errortype: 'UNKNOWN_ERROR',
            errorreporter: 'INTEGRATIONS'
          },
          {
            status: 500,
            errortype: 'UNKNOWN_ERROR',
            errorreporter: 'INTEGRATIONS'
          }
        ])
      }
    )

    it.each([{ errors: [] }, {}])(
      'should return retryable multistatus when deleteLeads response has no error details',
      async (errorBody) => {
        nock(settings.api_endpoint)
          .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
          .reply(200, {
            requestId: '0001#1234f2f3e4',
            success: true,
            warnings: [],
            errors: [],
            result: [{ id: 1 }, { id: 2 }]
          })

        nock(settings.api_endpoint)
          .delete('/rest/v1/lists/101/leads.json?id=1,2')
          .reply(200, {
            requestId: '0001#1234f2f3e4',
            success: false,
            warnings: [],
            ...errorBody
          })

        const response = await testDestination.executeBatch('removeFromList', {
          events,
          settings,
          mapping
        })

        expect(response).toMatchObject([
          {
            status: 500,
            errortype: 'UNKNOWN_ERROR',
            errorreporter: 'INTEGRATIONS'
          },
          {
            status: 500,
            errortype: 'UNKNOWN_ERROR',
            errorreporter: 'INTEGRATIONS'
          }
        ])
      }
    )

    it('should return multistatus for success', async () => {
      nock(settings.api_endpoint)
        .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: true,
          warnings: [],
          errors: [],
          result: [
            {
              id: 1
            },
            {
              id: 2
            }
          ]
        })

      nock(settings.api_endpoint).delete('/rest/v1/lists/101/leads.json?id=1,2').reply(200, {
        requestId: '0001#1234f2f3e4',
        success: true,
        warnings: [],
        errors: []
      })

      const response = await testDestination.executeBatch('removeFromList', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        body: {
          requestId: '0001#1234f2f3e4',
          success: true,
          warnings: [],
          errors: []
        },
        sent: 'id=1'
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: {
          requestId: '0001#1234f2f3e4',
          success: true,
          warnings: [],
          errors: []
        },
        sent: 'id=2'
      })
    })
  })
})
