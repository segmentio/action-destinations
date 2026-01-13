import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
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
  describe('Async Data Extension', () => {
    beforeEach(() => {
      nock.cleanAll()
    })

    describe('perform', () => {
      it('should send data to the async data extension endpoint', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`, {
            items: [{ id: 'version', name: 'MARK42' }]
          })
          .reply(200, {
            requestId: 'b241e73b-9b35-46ff-9c2d-e779ac5836a9',
            resultMessages: []
          })

        const responses = await testDestination.testAction('asyncDataExtension', {
          event,
          settings,
          mapping: payload
        })

        expect(responses.length).toBe(1)
        expect(responses[0].data).toEqual({
          requestId: 'b241e73b-9b35-46ff-9c2d-e779ac5836a9',
          resultMessages: []
        })
      })

      it('should work with retlOnMappingSave hook outputs', async () => {
        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(200, {
            requestId: 'test-request-id',
            resultMessages: []
          })

        const responses = await testDestination.testAction('asyncDataExtension', {
          event,
          settings,
          mapping: retlPayload
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('should throw an error if no data extension is connected', async () => {
        await expect(
          testDestination.testAction('asyncDataExtension', {
            event,
            settings,
            mapping: {
              keys: { id: 'version' },
              values: { name: 'MARK42' }
            }
          })
        ).rejects.toThrowError('No Data Extension Connected')
      })
    })

    describe('performBatch', () => {
      it('should send batched data to the async data extension endpoint', async () => {
        const events = [
          createTestEvent({ userId: 'user1', properties: { id: 'v1' } }),
          createTestEvent({ userId: 'user2', properties: { id: 'v2' } }),
          createTestEvent({ userId: 'user3', properties: { id: 'v3' } })
        ]

        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(200, {
            requestId: 'batch-request-id',
            resultMessages: []
          })

        const responses = await testDestination.testBatchAction('asyncDataExtension', {
          events,
          settings,
          mapping: payload
        })

        expect(responses.length).toBe(1)
        expect(responses[0].data).toEqual({
          requestId: 'batch-request-id',
          resultMessages: []
        })
      })

      it('should throw an error if no data extension is connected in batch mode', async () => {
        const events = [createTestEvent({ userId: 'user1' })]

        await expect(
          testDestination.testBatchAction('asyncDataExtension', {
            events,
            settings,
            mapping: {
              keys: { id: 'version' },
              values: { name: 'MARK42' }
            }
          })
        ).rejects.toThrowError('No Data Extension Connected')
      })

      it('should work with retlOnMappingSave hook outputs in batch mode', async () => {
        const events = [createTestEvent({ userId: 'user1', properties: { id: 'v1' } })]

        nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
          .put(`/data/v1/async/dataextensions/${dataExtensionId}/rows`)
          .reply(200, {
            requestId: 'retl-batch-request-id',
            resultMessages: []
          })

        const responses = await testDestination.testBatchAction('asyncDataExtension', {
          events,
          settings,
          mapping: retlPayload
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })
    })
  })
})
