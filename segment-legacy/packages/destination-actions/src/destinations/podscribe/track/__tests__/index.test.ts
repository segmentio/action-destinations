import nock from 'nock'
import { createTestEvent, createTestIntegration, defaultValues } from '@segment/actions-core'
import Destination from '../../index'
import track from '../../track'

const testDestination = createTestIntegration(Destination)

describe('Podscribe.track', () => {
  const TEST_ADVERTISER = 'test-advertiser'
  const TEST_IP = '11.111.11.11'
  const TEST_TIMESTAMP = '2021-07-12T23:02:40.563Z'

  it('should send signup event', async () => {
    nock('https://verifi.podscribe.com').get('/tag').query(true).reply(204, {})

    const event = createTestEvent({
      event: 'Signed Up',
      type: 'track'
    })

    const responses = await testDestination.testAction('track', {
      event,
      mapping: {
        ...defaultValues(track.fields),
        podscribeEvent: 'signup',
        ip: TEST_IP,
        timestamp: TEST_TIMESTAMP
      },
      settings: { advertiser: TEST_ADVERTISER }
    })

    expect(responses[0].status).toBe(204)
  })

  it('should send purchase event', async () => {
    nock('https://verifi.podscribe.com').get('/tag').query(true).reply(204, {})

    const event = createTestEvent({
      event: 'Order Completed',
      type: 'track'
    })

    const responses = await testDestination.testAction('track', {
      event,
      mapping: {
        ...defaultValues(track.fields),
        podscribeEvent: 'purchase'
      },
      settings: { advertiser: TEST_ADVERTISER }
    })

    expect(responses[0].status).toBe(204)
  })
})
