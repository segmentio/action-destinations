import nock from 'nock'
import { IntegrationError, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Definition)
const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

const createMetric = (name: string) => ({
  data: {
    type: 'metric',
    attributes: {
      name
    }
  }
})

const createRequestBody = (
  properties: Record<string, any>,
  value: number,
  metricName: string,
  profile: Record<string, any>
) => ({
  data: {
    type: 'event',
    attributes: {
      properties,
      value,
      metric: createMetric(metricName),
      profile: {
        data: {
          type: 'profile',
          attributes: profile
        }
      }
    }
  }
})

describe('Order Completed', () => {
  it('should throw error if no profile identifiers are provided', async () => {
    const event = createTestEvent({ type: 'track' })
    const mapping = { profile: {}, metric_name: 'fake-name', properties: {} }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).rejects.toThrowError(
      IntegrationError
    )
  })

  it('should successfully track event with external Id', async () => {
    const profile = { external_id: '3xt3rnal1d' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should successfully track event with anonymous Id', async () => {
    const profile = { anonymous_id: 'an0nym0u51d' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should successfully track event if proper parameters are provided', async () => {
    const profile = { email: 'test@example.com', phone_number: '1234567890' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should throw an error if the API request fails', async () => {
    const profile = { email: 'test@example.com', phone_number: '1234567890' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(500, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).rejects.toThrowError(
      'Internal Server Error'
    )
  })

  it('should successfully track event with products array', async () => {
    const products = [
      {
        image_url: 'https:///www.example.com/product/path.jpg',
        price: 19,
        name: 'Monopoly: 3rd Edition',
        quantity: 1,
        sku: '45790-32',
        product_id: '507f1f77bcf86cd799439011',
        url: 'https://www.example.com/product/path'
      }
    ]

    const profile = { email: 'test@example.com', phone_number: '1234567890' }
    const properties = { order_id: '1123' }
    const expectedEventProperties = {
      OrderId: '1123',
      Categories: [],
      ItemNames: ['Monopoly: 3rd Edition'],
      Items: [
        {
          Name: 'Monopoly: 3rd Edition',
          SKU: '45790-32',
          ItemPrice: 19,
          RowTotal: 19,
          ImageURL: 'https:///www.example.com/product/path.jpg',
          ProductURL: 'https://www.example.com/product/path',
          Quantity: 1,
          ProductId: '507f1f77bcf86cd799439011'
        }
      ]
    }
    const metricName = 'Order Completed'
    const value = 19

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile,
      metric_name: metricName,
      properties,
      value,
      products: products
    }

    const orderCompletedEvent = createRequestBody(expectedEventProperties, value, metricName, profile)

    nock(`${API_URL}`).post(`/events/`, orderCompletedEvent).reply(202, {})

    const orderedProductEvent = {
      data: {
        type: 'event',
        attributes: {
          properties: {
            OrderId: '1123',
            ProductId: '507f1f77bcf86cd799439011',
            SKU: '45790-32',
            ProductName: 'Monopoly: 3rd Edition',
            Quantity: 1,
            ProductURL: 'https://www.example.com/product/path',
            ImageURL: 'https:///www.example.com/product/path.jpg'
          },
          unique_id: `1123_507f1f77bcf86cd799439011`,
          value: value,
          metric: createMetric('Ordered Product'),
          profile: {
            data: {
              type: 'profile',
              attributes: profile
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post(`/events/`, orderedProductEvent).reply(200, {})

    await expect(testDestination.testAction(`orderCompleted`, { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should add Items, ItemNames and Categories summary at the top level of Ordered Product Event', async () => {
    const products = [
      {
        image_url: 'https:///www.example.com/product/path.jpg',
        price: 19,
        name: 'Monopoly: 3rd Edition',
        Categories: [],
        quantity: 1,
        sku: '45790-32',
        product_id: '507f1f77bcf86cd799439011',
        url: 'https://www.example.com/product/path',
        category: 'Board Games'
      },
      {
        image_url: 'https:///www.example.com/product/path.jpg',
        price: 19,
        name: 'Uno: 3rd Edition',
        Categories: [],
        quantity: 1,
        sku: '45790-32',
        product_id: '1507f1f77bcf86cd799439011',
        url: 'https://www.example.com/product/path',
        category: 'Card Games'
      }
    ]

    const profile = { email: 'test@example.com', phone_number: '1234567890' }
    const properties = { order_id: '1123' }
    const expectedEventProperties = {
      OrderId: '1123',
      Categories: ['Board Games', 'Card Games'],
      ItemNames: ['Monopoly: 3rd Edition', 'Uno: 3rd Edition'],
      Items: [
        {
          Name: 'Monopoly: 3rd Edition',
          Categories: ['Board Games'],
          SKU: '45790-32',
          ItemPrice: 19,
          RowTotal: 19,
          ImageURL: 'https:///www.example.com/product/path.jpg',
          ProductURL: 'https://www.example.com/product/path',
          Quantity: 1,
          ProductId: '507f1f77bcf86cd799439011'
        },
        {
          Name: 'Uno: 3rd Edition',
          SKU: '45790-32',
          Categories: ['Card Games'],
          ItemPrice: 19,
          RowTotal: 19,
          ImageURL: 'https:///www.example.com/product/path.jpg',
          ProductURL: 'https://www.example.com/product/path',
          Quantity: 1,
          ProductId: '1507f1f77bcf86cd799439011'
        }
      ]
    }
    const metricName = 'Order Completed'
    const value = 19

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile,
      metric_name: metricName,
      properties,
      value,
      products: products
    }

    const orderCompletedEvent = createRequestBody(expectedEventProperties, value, metricName, profile)

    nock(`${API_URL}`).post(`/events/`, orderCompletedEvent).reply(202, {})

    const orderedProductEvent1 = {
      data: {
        type: 'event',
        attributes: {
          properties: {
            OrderId: '1123',
            ProductId: '507f1f77bcf86cd799439011',
            SKU: '45790-32',
            ProductName: 'Monopoly: 3rd Edition',
            Categories: ['Board Games'],
            Quantity: 1,
            ProductURL: 'https://www.example.com/product/path',
            ImageURL: 'https:///www.example.com/product/path.jpg'
          },
          unique_id: `1123_507f1f77bcf86cd799439011`,
          value: value,
          metric: createMetric('Ordered Product'),
          profile: {
            data: {
              type: 'profile',
              attributes: profile
            }
          }
        }
      }
    }

    const orderedProductEvent2 = {
      data: {
        type: 'event',
        attributes: {
          properties: {
            OrderId: '1123',
            ProductId: '1507f1f77bcf86cd799439011',
            SKU: '45790-32',
            ProductName: 'Uno: 3rd Edition',
            Categories: ['Card Games'],
            Quantity: 1,
            ProductURL: 'https://www.example.com/product/path',
            ImageURL: 'https:///www.example.com/product/path.jpg'
          },
          unique_id: `1123_1507f1f77bcf86cd799439011`,
          value: value,
          metric: createMetric('Ordered Product'),
          profile: {
            data: {
              type: 'profile',
              attributes: profile
            }
          }
        }
      }
    }
    nock(`${API_URL}`).post(`/events/`, orderedProductEvent1).reply(202, {})
    nock(`${API_URL}`).post(`/events/`, orderedProductEvent2).reply(202, {})

    await expect(testDestination.testAction(`orderCompleted`, { event, mapping, settings })).resolves.not.toThrowError()
  })
})
