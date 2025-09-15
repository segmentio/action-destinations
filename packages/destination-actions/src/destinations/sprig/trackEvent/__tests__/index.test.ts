import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Sprig from '../../index'

const testDestination = createTestIntegration(Sprig)

describe('Sprig.trackEvent', () => {
  it('should create valid event payload', async () => {
    const event = createTestEvent({
      name: "Test Sprig Event",
      userId: "1234",
      timestamp: "2024-10-30T04:48:18.620Z",
      sentAt: "2024-10-30T04:48:18.620Z",
      receivedAt: "2024-10-30T04:48:18.620Z"
    })
    nock('https://api.sprig.com/v2').post('/users').reply(200, {})
    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: "TEST-API-KEY"
      }
    })
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
        userId: '1234',
        events: [{
          event: 'Test Event',
          timestamp: new Date("2024-10-30T04:48:18.620Z").getTime()
        }]
    })
    
  })
})
