import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'sendEntireEvent'

const settings: Settings = {
  movable_ink_url: 'https://www.test.com',
  username: 'test',
  password: 'test'
}

const event = createTestEvent({
  type: 'track',
  event: 'Webhook Event Happened',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    order_id: 'order_1',
    random_field: 'random_field_value',
    categories: [{ id: 'cat1' }],
    revenue: 100,
    products: [{ id: 'pid1' }]
  }
})

describe('MovableInk.sendEntireEvent', () => {
  it('should send entire payload to Movable Ink', async () => {
    nock(settings.movable_ink_url as string)
      .post(/.*/)
      .reply(200)

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      type: 'track',
      event: 'Webhook Event Happened',
      userId: 'user1234',
      anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      properties: {
        order_id: 'order_1',
        random_field: 'random_field_value',
        categories: [{ id: 'cat1' }],
        revenue: 100,
        products: [{ id: 'pid1' }]
      }
    })
  })
})
