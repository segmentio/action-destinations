import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Podscribe.page', () => {
  const TEST_ADVERTISER = 'test-advertiser'
  const TEST_IP = '11.111.11.11'
  const TEST_TIMESTAMP = '2021-07-12T23:02:40.563Z'

  it('should send view event', async () => {
    const params = new URLSearchParams({
      advertiser: TEST_ADVERTISER,
      action: 'view',
      ip: TEST_IP,
      timestamp: TEST_TIMESTAMP
    })
    nock('https://verifi.podscribe.com').get('/tag').query(params).reply(204, {})

    const event = createTestEvent({
      event: 'Test event'
    })

    const responses = await testDestination.testAction('page', {
      mapping: { properties: {}, name: 'page-name', ip: TEST_IP, timestamp: TEST_TIMESTAMP },
      event,
      settings: { advertiser: TEST_ADVERTISER }
    })

    expect(responses[0].status).toBe(204)
  })
})
