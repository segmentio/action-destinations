import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('DawnAnalytics.trackAi', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('should send event data to Dawn Analytics API correctly', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      properties: {
        key: 'value',
        number: 42,
        boolean: true
      }
    })

    nock('https://api.dawnai.com')
      .post('/track-ai')
      .reply(function (uri, requestBody) {
        // Check the request body
        expect(requestBody).toEqual([
          {
            event: 'Test Event',
            properties: {
              key: 'value',
              number: 42,
              boolean: true
            }
          }
        ])

        // Check the authorization header
        expect(this.req.headers.authorization).toBe('Bearer test-write-key')

        return [200, { success: true }]
      })

    const responses = await testDestination.testAction('trackAi', {
      event,
      useDefaultMappings: true,
      settings: {
        writeKey: 'test-write-key'
      }
    })

    // Check the response
    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })

    // Verify that all nock interceptors were used
    expect(nock.isDone()).toBe(true)
  })
})
