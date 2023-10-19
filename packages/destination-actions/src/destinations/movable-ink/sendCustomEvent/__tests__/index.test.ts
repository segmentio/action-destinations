import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'sendCustomEvent'

const settings: Settings = {
  movable_ink_url: 'https://www.test.com',
  username: 'test',
  password: 'test'
}

const event = createTestEvent({
  type: 'track',
  event: 'Custom Event Happened',
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

describe('MovableInk.sendCustomEvent', () => {
  it('should send event to Movable Ink and order_id, products, revenue, categories should not be duplicated in metadata field', async () => {
    nock(settings.movable_ink_url as string)
      .post(/.*/)
      .reply(200)

    const responses = await testDestination.testAction(actionSlug, {
      event,
      settings: settings,
      mapping: {
        event_name: { '@path': '$.event' },
        movable_ink_url: { '@path': '$.properties.movable_ink_url' },
        timestamp: { '@path': '$.timestamp' },
        anonymous_id: { '@path': '$.anonymousId' },
        user_id: { '@path': '$.userId' },
        order_id_required_false: { '@path': '$.properties.order_id' },
        revenue_required_false: { '@path': '$.properties.revenue' },
        categories_required_false: { '@path': '$.properties.categories' },
        products_required_false: { '@path': '$.properties.products' },
        meta: { '@path': '$.properties' }
      },
      useDefaultMappings: false
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      event_name: 'Custom Event Happened',
      user_id: 'user1234',
      anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      order_id: 'order_1',
      revenue: 100,
      products: [{ id: 'pid1' }],
      categories: [{ id: 'cat1' }],
      metadata: { random_field: 'random_field_value' }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { order_id: 'order_1' }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { revenue: 100 }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { categories: [{ id: 'cat1' }] }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { products: [{ id: 'pid1' }] }
    })
  })
})
