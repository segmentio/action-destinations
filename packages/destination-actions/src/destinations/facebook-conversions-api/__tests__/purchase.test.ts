import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  pixelId: '123321',
  token: 'EAAtest'
}

describe('authentication', () => {
  it('should validate authentication inputs', async () => {
    nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .get(`/events?access_token=${settings.token}`)
      .reply(201, {})

    await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
  })
})

describe('purchase', () => {
  it('should handle a basic event', async () => {
    nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events?access_token=${settings.token}`)
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '1631210063',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'nicholas.aguilar@segment.com',
        content_name: 'Shoes',
        content_type: 'product',
        contents: [{'id': 'ABC123', 'quantity': 2}, {'id': 'XYZ789', 'quantity': 3}],
        content_ids: ['ABC123', 'XYZ789'],
        num_items: 2
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings,
      mapping: {
        currency: {
          '@path': '$.properties.currency'
        },
        value: {
          '@path': '$.properties.value'
        },
        user_data: {
          email: {
            '@path': '$.properties.email'
          }
        },
        action_source: {
          '@path': '$.properties.action_source'
        },
        event_time: {
          '@path': '$.timestamp'
        },
        contents: {
          '@path': '$.properties.contents'
        },
        num_items: {
          '@path': '$.properties.num_items'
        },
        content_name: {
          '@path': '$.properties.content_name'
        },
        content_type: {
          '@path': '$.properties.content_type'
        },
        content_ids: {
          '@path': '$.properties.content_ids'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })

  it('should throw an error when currency and value are missing', async () => {
    nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
    .post(`/events?access_token=${process.env.TOKEN}`)
    .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      timestamp: '1631210063',
      properties: {
        action_source: 'website',
        userId: 'abc123',
        context: {
          traits: {
            email: 'nicholas.aguilar@segment.com'
          }
        }
      }
    })

    await expect(testDestination.testAction('purchase', {
      event,
      settings,
      mapping: {
        action_source: {
          '@path': '$.properties.action_source'
        },
        event_time: {
          '@path': '$.timestamp'
        }
      },
      useDefaultMappings: false
    })).rejects.toThrowError("The root value is missing the required field 'value'. The root value is missing the required field 'currency'.")
  })
  
  it('should throw an error if no user_data keys are included', async () => {
    nock(`https://graph.facebook.com/v11.0/${settings.pixelId}`)
      .post(`/events?access_token=${process.env.TOKEN}`)
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: '7b17fb0bd173f625b58636fb796407c22b3d16fc78302d79f0fd30c2fc2fc068', // Pre -hashed for simplicity
      timestamp: '1631210063',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12
      }
    })

    await expect(testDestination.testAction('purchase', {
      event,
      settings,
      mapping: {
        currency: {
          '@path': '$.properties.currency'
        },
        value: {
          '@path': '$.properties.value'
        },
        action_source: {
          '@path': '$.properties.action_source'
        },
        event_time: {
          '@path': '$.timestamp'
        }
        // No user data mapping included. This should cause action to fail.
      }
    })).rejects.toThrowError('Must include at least one user data property')
  })
})
