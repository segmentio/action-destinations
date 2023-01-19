import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination, { API_URL } from '../../index'

const testDestination = createTestIntegration(Destination)

describe('ActablePredictive.sendWebEvent', () => {
  function setUpTest() {
    // nockAuth()
    const nockRequests: any[] /* (typeof nock.ReplyFnContext.req)[] */ = []
    nock(API_URL)
      .post('')
      .reply(200, function (_uri, _requestBody) {
        nockRequests.push(this.req)
        return {}
      })
  }
  test('testWebEvent', async () => {
    setUpTest()

    const event = createTestEvent({
      type: 'track',
      userId: 'test-user-id',
      timestamp: '2021-10-05T15:30:35Z',
      event: 'Cart Add',
      context: {
        campaign: {
          name: 'springsale',
          source: 'source_springsale',
          medium: 'medium_springsale',
          term: 'term_springsale',
          content: 'content_springsale'
        }
      }
    })

    const r = await testDestination.testAction('sendWebEvent', {
      event,
      settings: { client_id: 'foo', client_secret: 'bar' },
      useDefaultMappings: true
    })

    const recievedEvent = r[0].options.json as any
    expect(r.length).toBe(1) // (no auth request)
    expect(recievedEvent.data[0]).toMatchObject({
      customer_id: 'test-user-id',
      datetime: 1633447835,
      stream_key: 'web',
      interaction_type: 'Cart Add',
      utm_campaign: 'springsale',
      utm_medium: 'medium_springsale',
      utm_source: 'source_springsale'
    })
  })
})
