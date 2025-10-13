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
  retlOnMappingSave: {
    outputs: {
      id: '1234567890'
    }
  }
}

const authUrl = `https://${settings.subdomain}.auth.marketingcloudapis.com/v2/token`
const externalKeyUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/data/v1/customobjects/1234567890`

describe('Salesforce Marketing Cloud', () => {
  describe('Async Data Extension', () => {
    it('should send data to the correct endpoint', async () => {
      // Mock authentication
      nock(authUrl).post('').reply(200, {
        access_token: 'test_access_token',
        soap_instance_url: 'https://test123.soap.marketingcloudapis.com/'
      })

      // Mock external key lookup
      nock(externalKeyUrl).get('').reply(200, {
        key: '1234567890'
      })

      // Mock the async data extension API
      nock(`https://${settings.subdomain}.rest.marketingcloudapis.com`)
        .post('/data/v1/async/dataextensions/key:1234567890/rows')
        .reply(200, {
          requestId: 'b241e73b-9b35-46ff-9c2d-e779ac5836a9',
          resultMessages: []
        })

      const responses = await testDestination.testAction('asyncDataExtension', {
        event,
        settings,
        mapping: payload
      })

      expect(responses.length).toBe(2) // One for external key lookup, one for async insert
      expect(responses[1].data).toEqual({
        requestId: 'b241e73b-9b35-46ff-9c2d-e779ac5836a9',
        resultMessages: []
      })
    })

    it('should throw an error if no data extension is connected', async () => {
      await expect(
        testDestination.testAction('asyncDataExtension', {
          event,
          settings,
          mapping: {
            keys: {
              id: 'version'
            },
            values: {
              name: 'MARK42'
            }
          }
        })
      ).rejects.toThrowError('No Data Extension Connected')
    })

    it('should throw an error if no external Key is found', async () => {
      nock.cleanAll()
      // Mock external key lookup with empty key
      nock(externalKeyUrl)
        .get('') // Make sure this path matches exactly what your code requests
        .reply(200, { key: '' })
        .persist() // Ensure the mock persists for multiple calls

      // Block any other unexpected requests
      nock.disableNetConnect()

      await expect(
        testDestination.testAction('asyncDataExtension', {
          event,
          settings,
          mapping: payload
        })
      ).rejects.toThrowError('No External Key found for Data Extension')
    })
  })
})
