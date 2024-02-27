import nock from 'nock'
import { IntegrationError, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Definition)
const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

const createProfile = (email: string, phoneNumber: string) => ({
  data: {
    type: 'profile',
    attributes: {
      email,
      phone_number: phoneNumber
    }
  }
})

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
  profile: { email: string; phone_number: string }
) => ({
  data: {
    type: 'event',
    attributes: {
      properties,
      value,
      metric: createMetric(metricName),
      profile: createProfile(profile.email, profile.phone_number)
    }
  }
})

describe('Order Completed', () => {
  it('should throw error if no email or phone_number is provided', async () => {
    const event = createTestEvent({ type: 'track' })
    const mapping = { profile: {}, metric_name: 'fake-name', properties: {} }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).rejects.toThrowError(
      IntegrationError
    )
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
        value: 10,
        properties: { key: 'value' }
      }
    ]

    const profile = { email: 'test@example.com', phone_number: '1234567890' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10

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

    const requestBodyForEvent = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post(`/events/`, requestBodyForEvent).reply(202, {})

    const requestBodyForProduct = createRequestBody(
      products[0].properties,
      products[0].value,
      'Ordered Product',
      profile
    )

    nock(`${API_URL}`).post(`/events/`, requestBodyForProduct).reply(200, {})

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).resolves.not.toThrowError()
  })
})
