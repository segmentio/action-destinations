import nock from 'nock'
import { createTestEvent, createTestIntegration, SegmentEvent, DynamicFieldResponse } from '@segment/actions-core'
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

describe('Salesforce Marketing Cloud', () => {
  describe('Data Extension V2', () => {
    beforeEach(() => {
      nock.cleanAll()
    })

    afterEach(() => {
      nock.cleanAll()
    })

    describe('perform', () => {
      it('should send data to the data extension endpoint using dataExtensionId', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`, [
            {
              keys: { id: 'version' },
              values: { name: 'MARK42' }
            }
          ])
          .reply(200, [
            {
              message: 'Record created successfully'
            }
          ])

        const responses = await testDestination.testAction('dataExtensionV2', {
          event,
          settings,
          mapping: payload
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
        expect(responses[0].data).toEqual([
          {
            message: 'Record created successfully'
          }
        ])
      })

      it('should work with retlOnMappingSave hook outputs', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(200, [
            {
              message: 'Record created successfully'
            }
          ])

        const responses = await testDestination.testAction('dataExtensionV2', {
          event,
          settings,
          mapping: retlPayload
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('should throw an error if no data extension is connected', async () => {
        await expect(
          testDestination.testAction('dataExtensionV2', {
            event,
            settings,
            mapping: {
              keys: { id: 'version' },
              values: { name: 'MARK42' }
            }
          })
        ).rejects.toThrowError('No Data Extension Connected')
      })

      it('should handle API error', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(400, {
            message: 'Bad Request',
            errorcode: 12345
          })

        await expect(
          testDestination.testAction('dataExtensionV2', {
            event,
            settings,
            mapping: payload
          })
        ).rejects.toThrow('Bad Request')
      })

      it('should handle 500 server error', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(500, {
            message: 'Internal Server Error'
          })

        await expect(
          testDestination.testAction('dataExtensionV2', {
            event,
            settings,
            mapping: payload
          })
        ).rejects.toThrow('Internal Server Error')
      })
    })

    describe('performBatch', () => {
      it('should send batched data to the data extension endpoint', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(200, [{ message: 'Success 1' }, { message: 'Success 2' }, { message: 'Success 3' }])

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
          })
        ]

        const mapping = {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: dataExtensionId
            }
          }
        }

        const responses = await testDestination.executeBatch('dataExtensionV2', {
          events,
          settings,
          mapping
        })

        expect(responses.length).toBe(3)
        expect(responses[0].status).toBe(200)
        expect(responses[0].body).toEqual({ message: 'Success 1' })
        expect(responses[1].status).toBe(200)
        expect(responses[2].status).toBe(200)
      })

      it('should throw an error if no data extension is connected in batch mode', async () => {
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

        const mapping = {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' }
        }

        await expect(
          testDestination.executeBatch('dataExtensionV2', {
            events,
            settings,
            mapping
          })
        ).rejects.toThrowError('No Data Extension Connected')
      })

      it('should work with retlOnMappingSave hook outputs in batch mode', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(200, [{ message: 'Success' }])

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

        const mapping = {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          retlOnMappingSave: {
            inputs: {},
            outputs: {
              id: dataExtensionId
            }
          }
        }

        const responses = await testDestination.executeBatch('dataExtensionV2', {
          events,
          settings,
          mapping
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('should handle API error in batch mode', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(400, {
            message: 'Bad Request in batch',
            errorcode: 12345,
            additionalErrors: [
              {
                message: 'Invalid field value'
              }
            ]
          })

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

        const mapping = {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: dataExtensionId
            }
          }
        }

        const responses = await testDestination.executeBatch('dataExtensionV2', {
          events,
          settings,
          mapping
        })

        expect(responses.length).toBe(1)
        expect(responses[0]).toMatchObject({
          status: 400,
          errortype: 'BAD_REQUEST',
          errormessage: 'Invalid field value'
        })
      })

      it('should handle 500 server error in batch mode', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(500, {
            message: 'Internal Server Error in batch'
          })

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

        const mapping = {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: dataExtensionId
            }
          }
        }

        const responses = await testDestination.executeBatch('dataExtensionV2', {
          events,
          settings,
          mapping
        })

        expect(responses.length).toBe(1)
        expect(responses[0]).toMatchObject({
          status: 500
        })
        expect(responses[0]).toHaveProperty('errormessage')
        expect((responses[0] as any).errormessage).toContain('Internal Server Error')
      })

      it('should handle retryable error (error code 10006) in batch mode', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .post(`/hub/v1/dataevents/${dataExtensionId}/rowset`)
          .reply(400, {
            message: 'Unable to save rows for data extension ID',
            errorcode: 10006
          })

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

        const mapping = {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: dataExtensionId
            }
          }
        }

        const responses = await testDestination.executeBatch('dataExtensionV2', {
          events,
          settings,
          mapping
        })

        expect(responses.length).toBe(1)
        // Error code 10006 should be marked as retryable (status 500)
        expect(responses[0]).toMatchObject({
          status: 500,
          errortype: 'INTERNAL_SERVER_ERROR'
        })
      })
    })

    describe('Dynamic Fields', () => {
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

        const response = (await testDestination.testDynamicField('dataExtensionV2', 'keys.__keys__', {
          settings,
          payload: {
            onMappingSave: {
              outputs: {
                id: dataExtensionId
              }
            }
          }
        })) as DynamicFieldResponse

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

        const response = (await testDestination.testDynamicField('dataExtensionV2', 'values.__keys__', {
          settings,
          payload: {
            onMappingSave: {
              outputs: {
                id: dataExtensionId
              }
            }
          }
        })) as DynamicFieldResponse

        expect(response.choices).toHaveLength(2)
        expect(response.choices).toEqual(
          expect.arrayContaining([
            { value: 'name', label: 'name' },
            { value: 'age', label: 'age' }
          ])
        )
      })

      it('should return error when no data extension ID is provided', async () => {
        const response = (await testDestination.testDynamicField('dataExtensionV2', 'keys.__keys__', {
          settings,
          payload: {}
        })) as DynamicFieldResponse

        expect(response.choices).toHaveLength(0)
        expect(response.error).toEqual({
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

        const response = (await testDestination.testDynamicField('dataExtensionV2', 'keys.__keys__', {
          settings,
          payload: {
            retlOnMappingSave: {
              outputs: {
                id: dataExtensionId
              }
            }
          }
        })) as DynamicFieldResponse

        expect(response.choices).toHaveLength(1)
        expect(response.choices).toEqual([{ value: 'subscriber_key', label: 'subscriber_key' }])
      })

      it('should work with retlOnMappingSave for values.__keys__', async () => {
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
              { name: 'first_name', isPrimaryKey: false },
              { name: 'last_name', isPrimaryKey: false }
            ]
          })

        const response = (await testDestination.testDynamicField('dataExtensionV2', 'values.__keys__', {
          settings,
          payload: {
            retlOnMappingSave: {
              outputs: {
                id: dataExtensionId
              }
            }
          }
        })) as DynamicFieldResponse

        expect(response.choices).toHaveLength(2)
        expect(response.choices).toEqual(
          expect.arrayContaining([
            { value: 'first_name', label: 'first_name' },
            { value: 'last_name', label: 'last_name' }
          ])
        )
      })
    })
  })
})
