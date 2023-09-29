import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from './index'
import { getRegionalEndpoint } from './utils'

const testDestination = createTestIntegration(Destination)

describe('Iterable', () => {
  describe('testAuthentication', () => {
    it('should authenticate with Iterable API key', async () => {
      nock('https://api.iterable.com').get('/api/webhooks').reply(200, {})

      const settings = {
        apiKey: 'iterableApiKey',
        dataCenterLocation: 'united_states'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should throw error on invalid Iterable API key', async () => {
      nock('https://api.iterable.com').get('/api/webhooks').reply(401, { msg: 'Invalid API key' })

      const settings = {
        apiKey: 'badApiKey',
        dataCenterLocation: 'united_states'
      }

      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError(
        'Credentials are invalid: 401 Unauthorized'
      )
    })
  })
})

describe('getRegionalEndpoint', () => {
  test('should return the correct endpoint for a specific action and region', () => {
    const action = 'updateUser'
    const dataCenterLocation = 'europe'
    const expectedEndpoint = 'https://api.eu.iterable.com/api/users/update'
    const endpoint = getRegionalEndpoint(action, dataCenterLocation)

    expect(endpoint).toBe(expectedEndpoint)
  })

  test('should use the default dataCenterLocation if no dataCenterLocation is provided', () => {
    const action = 'updateCart'
    const expectedEndpoint = 'https://api.iterable.com/api/commerce/updateCart'
    const endpoint = getRegionalEndpoint(action)

    expect(endpoint).toBe(expectedEndpoint)
  })
})
