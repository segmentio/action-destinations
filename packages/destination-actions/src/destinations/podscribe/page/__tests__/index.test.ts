import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Podscribe.page', () => {
  const TEST_ADVERTISER = 'test-advertiser'

  it('should send view event', async () => {
    const params = new URLSearchParams({ advertiser: TEST_ADVERTISER, action: 'view' })
    nock('https://verifi.podscribe.com').get('/tag').query(params).reply(204, {})

    const event = createTestEvent({
      event: 'Test event'
    })

    const responses = await testDestination.testAction('page', {
      mapping: { properties: {}, name: 'page-name' },
      event,
      settings: { advertiser: TEST_ADVERTISER }
    })

    expect(responses[0].status).toBe(204)
  })
})
