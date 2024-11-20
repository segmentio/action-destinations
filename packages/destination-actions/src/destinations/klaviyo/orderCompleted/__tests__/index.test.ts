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
  profile: Record<string, any>,
  time?: string
) => ({
  data: {
    type: 'event',
    attributes: {
      properties,
      value,
      time,
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

  it('should throw an error for invalid phone number format', async () => {
    const profile = { email: 'test@example.com', phone_number: 'invalid-phone-number', country_code: 'US' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).rejects.toThrowError(
      'invalid-phone-number is not a valid phone number and cannot be converted to E.164 format.'
    )
  })

  it('should convert a phone number to E.164 format if country code is provided', async () => {
    const profile = { phone_number: '8448309222', country_code: 'IN' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value, unique_id: 'text-example-xyz' }

    const requestBody = {
      data: {
        type: 'event',
        attributes: {
          properties: { key: 'value' },
          time: '2022-01-01T00:00:00.000Z',
          value: 10,
          unique_id: 'text-example-xyz',
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: metricName
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                phone_number: '+918448309222'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should successfully track event with external Id', async () => {
    const profile = { external_id: '3xt3rnal1d' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value, event_name: eventName }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should successfully track event with anonymous Id', async () => {
    const profile = { anonymous_id: 'an0nym0u51d' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value, event_name: eventName }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should successfully track event if proper parameters are provided', async () => {
    const profile = { email: 'test@example.com', phone_number: '+14155552671' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value, event_name: eventName }

    await expect(testDestination.testAction('orderCompleted', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should throw an error if the API request fails', async () => {
    const profile = { email: 'test@example.com', phone_number: '+14155552671' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'

    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(500, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = { profile, metric_name: metricName, properties, value, event_name: eventName }

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

    const profile = { email: 'test@example.com', phone_number: '+14155552671' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile,
      metric_name: metricName,
      properties,
      value,
      products: products,
      event_name: eventName
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

  it('should not throw an error when the time property has more than three digits in the milliseconds and should convert the time to ISO format.', async () => {
    const profile = { anonymous_id: 'an0nym0u51d' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'
    const time = '2024-07-22T20:08:49.891Z' // convert the timestamp from '2024-07-22T20:08:49.89191341Z'
    const timestamp = '2024-07-22T20:08:49.89191341Z'
    const requestBody = createRequestBody(properties, value, metricName, profile, time)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp
    })

    const mapping = { profile, metric_name: metricName, properties, value, event_name: eventName, time: timestamp }
    const res = await testDestination.testAction('orderCompleted', { event, mapping, settings })
    expect(res[0].options.body).toMatchSnapshot()
  })

  it('should successfully convert the timestamp for the time property to ISO format.', async () => {
    const profile = { anonymous_id: 'an0nym0u51d' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'
    const time = '2024-07-22T20:08:49.890Z'
    const timestamp = '2024-07-22T20:08:49.89Z'
    const requestBody = createRequestBody(properties, value, metricName, profile, time)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp
    })

    const mapping = { profile, metric_name: metricName, properties, value, event_name: eventName, time: timestamp }
    const res = await testDestination.testAction('orderCompleted', { event, mapping, settings })
    expect(res[0].options.body).toMatchSnapshot()
  })
  it('should not pass time property in API when it is not mapped', async () => {
    const profile = { anonymous_id: 'an0nym0u51d' }
    const properties = { key: 'value' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'
    const timestamp = '2024-07-22T20:08:49.89191341Z'
    const requestBody = createRequestBody(properties, value, metricName, profile)

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp
    })

    const mapping = { profile, metric_name: metricName, properties, value, event_name: eventName }

    const res = await testDestination.testAction('orderCompleted', { event, mapping, settings })
    expect(res[0].options.body).toMatchSnapshot()
  })

  it('should override event properties with product properties', async () => {
    const products = [
      {
        value: 10,
        name: 'product uno'
      }
    ]

    const profile = { email: 'test@example.com', phone_number: '+14155552671' }
    const properties = { key: 'value', name: 'Order Completed' }
    const metricName = 'Order Completed'
    const value = 10
    const eventName = 'Order Completed'

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile,
      metric_name: metricName,
      properties,
      value,
      products: products,
      event_name: eventName
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
          // check that product name is overriden
          body.data.attributes.properties.name === 'product uno' &&
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
