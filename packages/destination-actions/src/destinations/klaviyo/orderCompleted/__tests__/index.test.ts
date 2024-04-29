import nock from 'nock'
import { IntegrationError, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Definition)
const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

const createProfile = (email: string, phoneNumber: string, external_id: string) => ({
  data: {
    type: 'profile',
    attributes: {
      email,
      phone_number: phoneNumber,
      external_id
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
  profile: { email: string; phone_number: string; external_id: string }
) => ({
  data: {
    type: 'event',
    attributes: {
      properties,
      value,
      metric: createMetric(metricName),
      profile: createProfile(profile.email, profile.phone_number, profile.external_id)
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
    const profile = { email: 'test@example.com', phone_number: '1234567890', external_id: 'klaviyo_123' }
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
    const profile = { email: 'test@example.com', phone_number: '1234567890', external_id: 'klaviyo_123' }
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
        properties: { productKey: 'productValue' }
      }
    ]

    const profile = { email: 'test@example.com', phone_number: '1234567890', external_id: 'klaviyo_123' }
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

    nock(`${API_URL}`)
      .post(`/events/`, (body) => {
        // Validate that body has the correct structure using function
        // Can’t use an object because unique_id is randomly generated
        return (
          body.data &&
          body.data.type === `event` &&
          body.data.attributes &&
          body.data.attributes.properties &&
          typeof body.data.attributes.unique_id === `string` &&
          body.data.attributes.metric &&
          body.data.attributes.metric.data &&
          body.data.attributes.metric.data.type === `metric` &&
          body.data.attributes.metric.data.attributes &&
          body.data.attributes.metric.data.attributes.name === `Ordered Product` &&
          body.data.attributes.profile
        )
      })
      .reply(200, {})

    await expect(testDestination.testAction(`orderCompleted`, { event, mapping, settings })).resolves.not.toThrowError()
  })
})
