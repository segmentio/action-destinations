import nock from 'nock'
import {
  createTestEvent,
  createTestIntegration,
  SegmentEvent,
  DynamicFieldResponse,
  ActionDestinationErrorResponse
} from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2025-10-13T4:00:00.449Z'
const settings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}

const dataExtensionId = '1234567890'

const event = createTestEvent({
  timestamp: timestamp,
  type: 'track',
  userId: 'TonyStark001',
  properties: {
    id: 'ily3000'
  }
})

const payload = {
  keys: {
    id: 'version'
  },
  values: {
    name: 'MARK42'
  },
  onMappingSave: {
    inputs: {},
    outputs: {
      id: dataExtensionId
    }
  }
}

const retlPayload = {
  keys: {
    id: 'version'
  },
  values: {
    name: 'MARK42'
  },
  retlOnMappingSave: {
    inputs: {},
    outputs: {
      id: dataExtensionId
    }
  }
}

describe('Salesforce Marketing Cloud - Async', () => {
  describe('Async Data Extension Action for Async Pipeline', () => {
    beforeAll(() => {
      nock.cleanAll()
    })
    afterEach(() => {
      nock.cleanAll()
    })

    describe('Dynamic Fields Hooks', () => {
      it('should throw error when no dataExtensionId is provided in hook outputs', async () => {
        const hookResponse: DynamicFieldResponse = await testDestination.testDynamicField(
          'asyncDataExtension',
          'keys.__keys__',
          {
            settings,
            payload: {}
          }
        )

        expect(hookResponse.choices.length).toBe(0)
        expect(hookResponse.error).toEqual({
          message: 'No Data Extension ID provided',
          code: 'BAD_REQUEST'
        })
      })

      it('should work with retlOnMappingSave for keys.__keys__', async () => {
        // Mock auth token request
        nock(`https://${settings.subdomain}.auth.marketingcloudapis.com`).post('/v2/token').reply(200, {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        })

        // Mock data extension fields request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/customobjects/${dataExtensionId}/fields`)
          .reply(200, {
            fields: [
              { name: 'subscriber_key', isPrimaryKey: true },
              { name: 'first_name', isPrimaryKey: false }
            ]
          })

        const response = await testDestination.testDynamicField('asyncDataExtension', 'keys.__keys__', {
          settings,
          payload: {
            retlOnMappingSave: {
              outputs: {
                id: dataExtensionId
              }
            }
          }
        })

        expect(response.choices).toHaveLength(1)
        expect(response.choices).toEqual([{ value: 'subscriber_key', label: 'subscriber_key' }])
      })

      it('should return primary key fields for keys.__keys__', async () => {
        // Mock auth token request
        nock(`https://${settings.subdomain}.auth.marketingcloudapis.com`).post('/v2/token').reply(200, {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        })

        // Mock data extension fields request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/customobjects/${dataExtensionId}/fields`)
          .reply(200, {
            fields: [
              { name: 'id', isPrimaryKey: true },
              { name: 'email', isPrimaryKey: false },
              { name: 'name', isPrimaryKey: false },
              { name: 'age', isPrimaryKey: false }
            ]
          })

        const response = await testDestination.testDynamicField('asyncDataExtension', 'keys.__keys__', {
          settings,
          payload: {
            onMappingSave: {
              outputs: {
                id: dataExtensionId
              }
            }
          }
        })

        expect(response.choices).toHaveLength(1)
        expect(response.choices).toEqual(expect.arrayContaining([{ value: 'id', label: 'id' }]))
      })

      it('should return non-primary key fields for values.__keys__', async () => {
        // Mock auth token request
        nock(`https://${settings.subdomain}.auth.marketingcloudapis.com`).post('/v2/token').reply(200, {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        })

        // Mock data extension fields request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/customobjects/${dataExtensionId}/fields`)
          .reply(200, {
            fields: [
              { name: 'id', isPrimaryKey: true },
              { name: 'email', isPrimaryKey: true },
              { name: 'name', isPrimaryKey: false },
              { name: 'age', isPrimaryKey: false }
            ]
          })

        const response = await testDestination.testDynamicField('asyncDataExtension', 'values.__keys__', {
          settings,
          payload: {
            onMappingSave: {
              outputs: {
                id: dataExtensionId
              }
            }
          }
        })

        expect(response.choices).toHaveLength(2)
        expect(response.choices).toEqual(
          expect.arrayContaining([
            { value: 'name', label: 'name' },
            { value: 'age', label: 'age' }
          ])
        )
      })
    })

    describe('performBatch', () => {
      it('should submit batch with retlOnMappingSave hook outputs and returns jobId', async () => {
        // Mock auth token request
        nock(`https://${settings.subdomain}.auth.marketingcloudapis.com`).post('/v2/token').reply(200, {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        })

        // Mock async batch request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(200, {
            requestId: 'test-job-id',
            resultMessages: []
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events: [event],
          settings,
          mapping: retlPayload
        })

        expect(response.jobId).toBe('test-job-id')
        expect(response.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(200)
      })

      it('should throw an error if no data extension is connected', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'track',
            userId: 'user1',
            properties: {
              keys: { id: 'v1' },
              values: { name: 'User 1' }
            }
          })
        ]

        const mappingWithoutId = {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' }
        }

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events,
          settings,
          mapping: mappingWithoutId
        })

        const errResponse0a = response.multiStatusResponse.getResponseAtIndex(0)
        expect(errResponse0a.value().status).toBe(400)
        expect(errResponse0a instanceof ActionDestinationErrorResponse && errResponse0a.value().errormessage).toEqual(
          'No Data Extension Connected'
        )
      })

      it('should submit batch to SFMC and returns jobId', async () => {
        // Mock auth token request
        nock(`https://${settings.subdomain}.auth.marketingcloudapis.com`).post('/v2/token').reply(200, {
          access_token: 'test-access-token',
          token_type: 'Bearer',
          expires_in: 3600
        })

        // Mock async batch request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(200, {
            requestId: 'test-job-id',
            resultMessages: []
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events: [event],
          settings,
          mapping: payload
        })

        expect(response.jobId).toBe('test-job-id')
        expect(response.multiStatusResponse.getResponseAtIndex(0).value().status).toBe(200)
      })

      it('should handle non-OK errors with resultMessages', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'track',
            userId: 'user1',
            properties: {
              keys: { id: 'v1' },
              values: { name: 'User 1' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user2',
            properties: {
              keys: { id: 'v2' },
              values: { name: 'User 2' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user3',
            properties: {
              keys: { id: 'v3' },
              values: { name: 'User 3' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user4',
            properties: {
              keys: { id: 'v4' },
              values: { name: 'User 4' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user5',
            properties: {
              keys: { id: 'v5' },
              values: { name: 'User 5' }
            }
          })
        ]

        // Mock async batch request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(400, {
            requestId: 'test-job-id',
            resultMessages: [
              {
                resultType: 'Validation',
                resultClass: 'Error',
                resultCode: 'CustomObjectNotFound',
                message:
                  'Failed to resolve the Custom Object from the provided ObjectReferenceIdentifier [Id: a52c65d8-8938-f111-a5ab-d4f5ef4cd471, Key: ].'
              }
            ]
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events,
          settings,
          mapping: payload
        })

        expect(response.jobId).toBe('test-job-id')
        const errResponse0b = response.multiStatusResponse.getResponseAtIndex(0)
        expect(errResponse0b.value().status).toBe(400)
        expect(errResponse0b instanceof ActionDestinationErrorResponse && errResponse0b.value().errormessage).toEqual(
          'Failed to resolve the Custom Object from the provided ObjectReferenceIdentifier [Id: a52c65d8-8938-f111-a5ab-d4f5ef4cd471, Key: ].'
        )
      })

      it('should handle non-OK errors with empty resultMessages', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'track',
            userId: 'user1',
            properties: {
              keys: { id: 'v1' },
              values: { name: 'User 1' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user2',
            properties: {
              keys: { id: 'v2' },
              values: { name: 'User 2' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user3',
            properties: {
              keys: { id: 'v3' },
              values: { name: 'User 3' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user4',
            properties: {
              keys: { id: 'v4' },
              values: { name: 'User 4' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user5',
            properties: {
              keys: { id: 'v5' },
              values: { name: 'User 5' }
            }
          })
        ]

        // Mock async batch request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(400, {
            requestId: undefined,
            resultMessages: []
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events,
          settings,
          mapping: payload
        })
        expect(response.jobId).toBeUndefined()
        const errResponse0c = response.multiStatusResponse.getResponseAtIndex(0)
        expect(errResponse0c.value().status).toBe(400)
        expect(errResponse0c instanceof ActionDestinationErrorResponse && errResponse0c.value().errormessage).toEqual(
          'SFMC API responded with {"resultMessages":[]}.'
        )
      })

      it('should surface 401 status code in multi-status response', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(401, {
            message: 'Not Authorized',
            errorcode: 1,
            documentation: ''
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events: [event],
          settings,
          mapping: payload
        })

        expect(response.jobId).toBeUndefined()
        const errResponse = response.multiStatusResponse.getResponseAtIndex(0)
        expect(errResponse.value().status).toBe(401)
        expect(errResponse instanceof ActionDestinationErrorResponse && errResponse.value().errormessage).toEqual(
          'Not Authorized'
        )
      })

      it('should surface 403 status code in multi-status response', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(403, {
            message: 'Forbidden',
            errorcode: 3,
            documentation: ''
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events: [event],
          settings,
          mapping: payload
        })

        expect(response.jobId).toBeUndefined()
        const errResponse = response.multiStatusResponse.getResponseAtIndex(0)
        expect(errResponse.value().status).toBe(403)
        expect(errResponse instanceof ActionDestinationErrorResponse && errResponse.value().errormessage).toEqual(
          'Forbidden'
        )
      })

      it('should surface 500 status code in multi-status response', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(500, {
            message: 'Internal Server Error',
            documentation: ''
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events: [event],
          settings,
          mapping: payload
        })

        expect(response.jobId).toBeUndefined()
        const errResponse = response.multiStatusResponse.getResponseAtIndex(0)
        expect(errResponse.value().status).toBe(500)
        expect(errResponse instanceof ActionDestinationErrorResponse && errResponse.value().errormessage).toEqual(
          'Internal Server Error'
        )
      })

      it('should handle non-OK errors without resultMessages', async () => {
        const events: SegmentEvent[] = [
          createTestEvent({
            type: 'track',
            userId: 'user1',
            properties: {
              keys: { id: 'v1' },
              values: { name: 'User 1' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user2',
            properties: {
              keys: { id: 'v2' },
              values: { name: 'User 2' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user3',
            properties: {
              keys: { id: 'v3' },
              values: { name: 'User 3' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user4',
            properties: {
              keys: { id: 'v4' },
              values: { name: 'User 4' }
            }
          }),
          createTestEvent({
            type: 'track',
            userId: 'user5',
            properties: {
              keys: { id: 'v5' },
              values: { name: 'User 5' }
            }
          })
        ]

        // Mock async batch request
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(400, {
            message: 'Parameter {id} is invalid.',
            errorcode: 10001,
            documentation: ''
          })

        const response = await testDestination.testAsyncBatchAction('asyncDataExtension', {
          events,
          settings,
          mapping: payload
        })
        expect(response.jobId).toBeUndefined()
        const errResponse0d = response.multiStatusResponse.getResponseAtIndex(0)
        expect(errResponse0d.value().status).toBe(400)
        expect(errResponse0d instanceof ActionDestinationErrorResponse && errResponse0d.value().errormessage).toEqual(
          'Parameter {id} is invalid.'
        )
      })
    })

    describe('performPoll', () => {
      const jobId = 'test-job-id'
      const pollPayload = {
        jobId,
        attempt: 1,
        totalEventsCount: 5,
        validEventsCount: 5
      }

      it('should return IN_PROGRESS when requestStatus is Pending', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(200, {
            requestId: jobId,
            status: { requestStatus: 'Pending', resultStatus: 'OK' },
            resultMessages: []
          })

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobId).toBe(jobId)
        expect(response.jobStatus).toBe('IN_PROGRESS')
      })

      it('should return IN_PROGRESS when requestStatus is Executing', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(200, {
            requestId: jobId,
            status: { requestStatus: 'Executing', resultStatus: 'OK' },
            resultMessages: []
          })

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobId).toBe(jobId)
        expect(response.jobStatus).toBe('IN_PROGRESS')
      })

      it('should return RETRYABLE_ERROR on 429 rate limit error', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(429, 'Too Many Requests')

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobStatus).toBe('RETRYABLE_ERROR')
        expect(response.status).toBe(429)
      })

      it('should return RETRYABLE_ERROR on 500 server error', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(500, 'Internal Server Error')

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobStatus).toBe('RETRYABLE_ERROR')
        expect(response.status).toBe(500)
      })

      it('should return SUCCEEDED when requestStatus is Complete and resultStatus is OK', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(200, {
            status: {
              callDateTime: '2024-07-11T22:19:02.04',
              completionDateTime: '2024-07-11T22:19:03.97',
              hasErrors: false,
              pickupDateTime: '2024-07-11T22:19:03.567',
              requestStatus: 'Complete',
              resultStatus: 'OK',
              requestId: '12260e92-b8cb-41ec-8c5a-116fb9d23eb4'
            },
            requestId: '615f178b-d380-440c-a650-defd99b1efde',
            resultMessages: []
          })

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobId).toBe(jobId)
        expect(response.jobStatus).toBe('SUCCEEDED')
        expect(response.status).toBe(200)
        expect(response.multiStatusResponse).toBeUndefined()
      })

      it('should return SUCCEEDED with multiStatusResponse when Complete but Has Errors', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(200, {
            requestId: jobId,
            status: { requestStatus: 'Complete', resultStatus: 'Has Errors' },
            resultMessages: []
          })

        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/results`)
          .reply(200, {
            page: 1,
            pageSize: 50,
            count: 5,
            items: [
              {
                errorCode: 2,
                errors: [
                  {
                    errorMessage: 'Column [contactkey] does not allow null value.',
                    name: 'contactkey',
                    errorCode: 70001
                  }
                ],
                message: 'Cannot locate the existing record. Required keys are missing.',
                status: 'Error'
              },
              {
                message: 'Upserted DataExtensionObject',
                status: 'OK'
              },
              {
                message: 'Upserted DataExtensionObject',
                status: 'OK'
              },
              {
                errorCode: 2,
                errors: [
                  {
                    errorMessage: 'Column [contactkey] does not allow null value.',
                    name: 'contactkey',
                    errorCode: 70001
                  }
                ],
                message: 'Cannot locate the existing record. Required keys are missing.',
                status: 'Error'
              }
            ],
            requestId: '424b760c-7410-4598-b977-ebf1d01b3555',
            resultMessages: []
          })

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobStatus).toBe('SUCCEEDED')
        expect(response.multiStatusResponse).toBeDefined()
        expect(response.multiStatusResponse?.isErrorResponseAtIndex(0)).toBe(true)
        expect(response.multiStatusResponse?.isSuccessResponseAtIndex(1)).toBe(true)
        expect(response.multiStatusResponse?.isSuccessResponseAtIndex(2)).toBe(true)
        expect(response.multiStatusResponse?.errorCount).toBe(2)
        expect(response.multiStatusResponse?.successCount).toBe(2)
      })

      it('should return FAILED when requestStatus is Error', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(200, {
            status: {
              callDateTime: '2024-07-11T22:19:02.04',
              completionDateTime: '2024-07-11T22:19:03.97',
              hasErrors: false,
              pickupDateTime: '2024-07-11T22:19:03.567',
              requestStatus: 'Error',
              resultStatus: 'OK',
              requestId: '12260e92-b8cb-41ec-8c5a-116fb9d23eb4'
            },
            requestId: '615f178b-d380-440c-a650-defd99b1efde',
            resultMessages: []
          })

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobId).toBe(jobId)
        expect(response.jobStatus).toBe('FAILED')
        expect(response.status).toBe(200)
      })

      it('should return FAILED when status object is missing in response', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .get(`/data/v1/async/${jobId}/status`)
          .reply(200, {
            requestId: '615f178b-d380-440c-a650-defd99b1efde',
            resultMessages: []
          })

        const response = await testDestination.testAsyncPollAction('asyncDataExtension', {
          pollPayload,
          settings
        })

        expect(response.jobStatus).toBe('FAILED')
        expect(response.status).toBe(200)
      })
    })
  })
})
