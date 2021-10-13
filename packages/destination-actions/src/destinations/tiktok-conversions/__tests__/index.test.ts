import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2021-09-2T15:21:15.449Z'

describe('Tiktok Conversions', () => {
  describe('reportWebEvent', () => {
    it('should send a successful event to reportWebEvent', async () => {
      const settings: Settings = {
        accessToken: 'test',
        appId: 'test',
        secretKey: 'test',
        pixel_code: 'test'
      }

      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track',
        properties: {
          email: 'coreytest1231@gmail.com',
          phone: '+1555-555-5555'
        },
        userId: 'testId123'
      })

      nock('https://business-api.tiktok.com/open_api/v1.2/pixel/track').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
