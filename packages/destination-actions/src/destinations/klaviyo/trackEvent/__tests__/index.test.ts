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
  it('should throw error if no profile identifiers are provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })
    const mapping = { profile: {}, metric_name: 'fake-name', properties: {} }

    await expect(testDestination.testAction('trackEvent', { event, mapping, settings })).rejects.toThrowError(
      IntegrationError
    )
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
                phone_number: '1234567890'
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
      profile: { email: 'test@example.com', phone_number: '1234567890' },
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
                phone_number: '1234567890'
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
      profile: { email: 'test@example.com', phone_number: '1234567890' },
      metric_name: 'event_name',
      properties: { key: 'value' },
      value: 10,
      unique_id: 'text-example-123'
    }

    await expect(
      testDestination.testAction('trackEvent', { event, mapping, settings, useDefaultMappings: true })
    ).rejects.toThrowError('Internal Server Error')
  })
})
