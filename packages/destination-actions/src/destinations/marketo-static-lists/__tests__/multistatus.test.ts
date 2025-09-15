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

    it('should return multistatus for any other error', async () => {
      nock(settings.api_endpoint)
        .post('/bulk/v1/leads.json?format=csv&listId=101&lookupField=email')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [
            {
              code: '612',
              message: 'Invalid Content Type'
            }
          ]
        })

      const response = await testDestination.executeBatch('addToList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errortype: 'NOT_ACCEPTABLE',
          errormessage: 'Invalid Content Type',
          errorreporter: 'INTEGRATIONS'
        },
        {
          status: 400,
          errortype: 'NOT_ACCEPTABLE',
          errormessage: 'Invalid Content Type',
          errorreporter: 'INTEGRATIONS'
        }
      ])
    })

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

    it('should return multistatus for any other error', async () => {
      nock(settings.api_endpoint)
        .get('/rest/v1/leads.json?filterType=email&filterValues=test1%40example.org%2Ctest2%40example.org')
        .reply(200, {
          requestId: '0001#1234f2f3e4',
          success: false,
          warnings: [],
          errors: [
            {
              code: '612',
              message: 'Invalid Content Type'
            }
          ]
        })

      const response = await testDestination.executeBatch('removeFromList', {
        events,
        settings,
        mapping
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errortype: 'NOT_ACCEPTABLE',
          errormessage: 'Invalid Content Type',
          errorreporter: 'INTEGRATIONS'
        },
        {
          status: 400,
          errortype: 'NOT_ACCEPTABLE',
          errormessage: 'Invalid Content Type',
          errorreporter: 'INTEGRATIONS'
        }
      ])
    })

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
