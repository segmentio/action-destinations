import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Podscribe.track', () => {
  const TEST_ADVERTISER = 'test-advertiser'

  it('should send signup event', async () => {
    const params = new URLSearchParams({ advertiser: TEST_ADVERTISER, action: 'signup' })
    nock('https://verifi.podscribe.com').get('/tag').query(params).reply(204, {})

    const event = createTestEvent({
      event: 'Signed Up'
    })

    const responses = await testDestination.testAction('track', {
      event,
      mapping: { event: 'Signed Up' },
      settings: { advertiser: TEST_ADVERTISER }
    })

    expect(responses[0].status).toBe(204)
  })

  it('should send purchase event', async () => {
    const params = new URLSearchParams({ advertiser: TEST_ADVERTISER, action: 'purchase' })
    nock('https://verifi.podscribe.com').get('/tag').query(params).reply(204, {})

    const event = createTestEvent({
      event: 'Order Completed'
    })

    const responses = await testDestination.testAction('track', {
      event,
      mapping: { event: 'Order Completed' },
      settings: { advertiser: TEST_ADVERTISER }
    })

    expect(responses[0].status).toBe(204)
  })
})
