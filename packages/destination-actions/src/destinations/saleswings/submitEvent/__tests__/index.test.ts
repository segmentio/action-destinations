import { createTestEvent as createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import nock from 'nock'
import { apiBaseUrl } from '../../api'

const testDestination = createTestIntegration(Destination)

const settings = { apiKey: 'TEST_API_KEY' }

describe('SalesWings', () => {
  describe('.submitEvent', () => {
    test('should submit event on Track event', async () => {
      nock(apiBaseUrl).post('/events').reply(200, {})

      const event = createTestEvent({
        type: 'track',
        event: 'User Registered',
        properties: {
          plan: 'Pro Annual',
          accountType: 'Facebook'
        }
      })

      const responses = await testDestination.testAction('submitEvent', { event, settings, useDefaultMappings: true })
      expect(responses[0].request.headers.get('Authorization')).toBe(`Bearer ${settings.apiKey}`)
    })

    test('should skip Track event if name not specified', async () => {})

    test('should submit event on Page event', async () => {})

    test('should skip Page event if url not specified', async () => {})

    test('should submit event on Identify event', async () => {})

    test('should skip Identify event if email not specified', async () => {})

    test('should submit event on Screen event', async () => {})

    test('should skip Screen event if name not specified', async () => {})

    test('should use custom event property mapping', async () => {})

    test('should skip an event is neither userID nor anonymousID are specified', async () => {})
  })
})
