import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'conversion'

const settings: Settings = {
  movable_ink_url: 'https://www.test.com',
  username: 'test',
  password: 'test'
}

const event = createTestEvent({
  type: 'track',
  event: 'Order Completed',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    order_id: 'order_1',
    revenue: 100,
    products: [{ product_id: 'pid_1' }]
  }
})

const eventNoOrderId = createTestEvent({
  type: 'track',
  event: 'Category Viewed',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    revenue: 100,
    products: [{ product_id: 'pid_1' }]
  }
})

const eventNoProducts = createTestEvent({
  type: 'track',
  event: 'Category Viewed',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    order_id: 'order_1',
    revenue: 100
  }
})

const eventNoRevenue = createTestEvent({
  type: 'track',
  event: 'Category Viewed',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    order_id: 'order_1',
    products: [{ product_id: 'pid_1' }]
  }
})

const eventWithMetadata = createTestEvent({
  type: 'track',
  event: 'Order Completed',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    order_id: 'order_1',
    revenue: 100,
    products: [{ product_id: 'pid_1' }],
    random_field: 'random_field_value'
  }
})

describe('MovableInk.conversion', () => {
  it('should send event to Movable Ink if revenue and products and order_id provided', async () => {
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
      event_name: 'Conversion',
      user_id: 'user1234',
      anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      order_id: 'order_1',
      products: [{ id: 'pid_1' }],
      revenue: 100
    })
  })

  it('should throw an error if revenue missing', async () => {
    await expect(
      testDestination.testAction(actionSlug, {
        event: eventNoOrderId,
        useDefaultMappings: true,
        settings: settings
      })
    ).rejects.toThrowError("The root value is missing the required field 'order_id'.")
  })

  it('should throw an error if products missing', async () => {
    await expect(
      testDestination.testAction(actionSlug, {
        event: eventNoProducts,
        useDefaultMappings: true,
        settings: settings
      })
    ).rejects.toThrowError("The root value is missing the required field 'products'.")
  })

  it('should throw an error if revenue missing', async () => {
    await expect(
      testDestination.testAction(actionSlug, {
        event: eventNoRevenue,
        useDefaultMappings: true,
        settings: settings
      })
    ).rejects.toThrowError("The root value is missing the required field 'revenue'.")
  })

  it('should send event to Movable Ink and should exclude products order_id and categories from metadata field', async () => {
    nock(settings.movable_ink_url as string)
      .post(/.*/)
      .reply(200)

    const responses = await testDestination.testAction(actionSlug, {
      event: eventWithMetadata,
      settings: settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      event_name: 'Conversion',
      user_id: 'user1234',
      anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      order_id: 'order_1',
      products: [{ id: 'pid_1' }],
      revenue: 100,
      metadata: { random_field: 'random_field_value' }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { order_id: 'order_1' }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { products: [{ id: 'pid_1' }] }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { revenue: 100 }
    })
  })
})
