import nock from 'nock'
import { IntegrationError, createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}

describe('Track Event', () => {
  beforeEach(() => {
    nock.cleanAll()
    jest.resetAllMocks()
  })

  it('should throw error if no profile identifiers are provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })
    const mapping = { profile: {}, metric_name: 'fake-name', properties: {} }

    await expect(testDestination.testAction('trackEvent', { event, mapping, settings })).rejects.toThrowError(
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
                name: 'event_name'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                external_id: '3xt3rnal1d'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile: { external_id: '3xt3rnal1d' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-xyz'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should successfully track event with anonymous Id', async () => {
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
                name: 'event_name'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                anonymous_id: 'an0nym0u51d'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile: { anonymous_id: 'an0nym0u51d' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-xyz'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should successfully track event if proper parameters are provided', async () => {
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
                name: 'event_name'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: 'test@example.com',
                phone_number: '+14155552671'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile: { email: 'test@example.com', phone_number: '+14155552671' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-xyz'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if the API request fails', async () => {
    const requestBody = {
      data: {
        type: 'event',
        attributes: {
          properties: { key: 'value' },
          time: '2022-01-01T00:00:00.000Z',
          value: 10,
          unique_id: 'text-example-123',
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'event_name'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                email: 'test@example.com',
                phone_number: '+14155552671'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(500, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2022-01-01T00:00:00.000Z'
    })

    const mapping = {
      profile: { email: 'test@example.com', phone_number: '+14155552671' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-123'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).rejects.toThrowError('Internal Server Error')
  })

  it('should successfully convert the timestamp for the time property to ISO format.', async () => {
    const requestBody = {
      data: {
        type: 'event',
        attributes: {
          properties: { key: 'value' },
          time: '2024-07-22T20:08:49.790Z',
          value: 10,
          unique_id: 'text-example-xyz',
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'event_name'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                anonymous_id: 'an0nym0u51d'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2024-07-22T20:08:49.79Z'
    })

    const mapping = {
      profile: { anonymous_id: 'an0nym0u51d' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-xyz'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })
  it('should not throw an error when the time property has more than three digits in the milliseconds and should convert the time to ISO format.', async () => {
    const timestamp = '2024-09-11T20:08:49.8919123123Z'
    const requestBody = {
      data: {
        type: 'event',
        attributes: {
          properties: { key: 'value' },
          time: '2024-09-11T20:08:49.891Z', // convert the timestamp from '2024-07-22T20:08:49.89191341Z'
          value: 10,
          unique_id: 'text-example-xyz',
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'event_name'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                anonymous_id: 'an0nym0u51d'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp
    })

    const mapping = {
      profile: { anonymous_id: 'an0nym0u51d' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-xyz'
    }

    const res = await testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    expect(res[0].options.body).toMatchSnapshot()
  })

  it('should not pass time property in API when it is not mapped or defined', async () => {
    const requestBody = {
      data: {
        type: 'event',
        attributes: {
          properties: { key: 'value' },
          value: 10,
          unique_id: 'text-example-xyz',
          metric: {
            data: {
              type: 'metric',
              attributes: {
                name: 'event_name'
              }
            }
          },
          profile: {
            data: {
              type: 'profile',
              attributes: {
                anonymous_id: 'an0nym0u51d'
              }
            }
          }
        }
      }
    }

    nock(`${API_URL}`).post('/events/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      timestamp: '2024-07-22T20:08:49.79Z'
    })

    const mapping = {
      profile: { anonymous_id: 'an0nym0u51d' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-xyz'
    }

    const res = await testDestination.testAction('trackEvent', { event, mapping, settings })
    expect(res[0].options.body).toMatchSnapshot()
  })
})
