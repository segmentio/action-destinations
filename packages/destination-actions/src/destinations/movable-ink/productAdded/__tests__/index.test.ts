import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)
const actionSlug = 'productAdded'

const settings: Settings = {
  movable_ink_url: 'https://www.test.com',
  username: 'test',
  password: 'test'
}

const event = createTestEvent({
  type: 'track',
  event: 'Product Added',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    product_id: 'pid_1'
  }
})

const eventNoProductId = createTestEvent({
  type: 'track',
  event: 'Product Added',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {}
})

const eventWithMetadata = createTestEvent({
  type: 'track',
  event: 'Product Added',
  userId: 'user1234',
  anonymousId: '72d7bed1-4f42-4f2f-8955-72677340546b',
  timestamp: '2022-03-30T17:24:58Z',
  properties: {
    product_id: 'pid_1',
    categories: [{ id: 'cat1' }],
    random_field: 'random_field_value'
  }
})

describe('MovableInk.productAdded', () => {
  it('should send event to Movable Ink if product_id provided', async () => {
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
      event_name: 'Cart Add',
      user_id: 'user1234',
      anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      product: { id: 'pid_1' }
    })
  })

  it('should throw an error if no product_id in payload', async () => {
    await expect(
      testDestination.testAction(actionSlug, {
        event: eventNoProductId,
        useDefaultMappings: true,
        settings: settings
      })
    ).rejects.toThrowError("Product Details is missing the required field 'id'.")
  })

  it('should send event to Movable Ink and should exclude product and categories from metadata field', async () => {
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
      event_name: 'Cart Add',
      user_id: 'user1234',
      anonymous_id: '72d7bed1-4f42-4f2f-8955-72677340546b',
      timestamp: '2022-03-30T17:24:58Z',
      product: { id: 'pid_1' },
      categories: [{ id: 'cat1' }],
      metadata: { random_field: 'random_field_value' }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { product: { id: 'pid_1' } }
    })
    expect(responses[0].options.json).not.toMatchObject({
      metadata: { categories: [{ id: 'cat1' }] }
    })
  })
})
