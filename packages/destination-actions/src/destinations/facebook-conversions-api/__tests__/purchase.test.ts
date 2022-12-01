import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../constants'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  testEventCode: '',
  token: 'EAAtest'
}
const settingsWithTestEventCode = {
  pixelId: '123321',
  testEventCode: '1234567890',
  token: process.env.TOKEN
}

describe('purchase', () => {
  it('should handle a basic event', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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
        contents: [
          { id: 'ABC123', quantity: 2 },
          { id: 'XYZ789', quantity: 3 }
        ],
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

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"content_ids\\":[\\"ABC123\\",\\"XYZ789\\"],\\"content_name\\":\\"Shoes\\",\\"content_type\\":\\"product\\",\\"contents\\":[{\\"id\\":\\"ABC123\\",\\"quantity\\":2},{\\"id\\":\\"XYZ789\\",\\"quantity\\":3}],\\"num_items\\":2}}]}"`
    )
  })

  it('should handle default mappings', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      messageId: 'test',
      timestamp: '1631210063',
      properties: {
        userId: 'testuser1234',
        action_source: 'email',
        currency: 'USD',
        revenue: 12.12,
        products: [
          { product_id: '123', quantity: 1, price: 100 },
          { product_id: '345', quantity: 2, price: 50 }
        ]
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings,
      useDefaultMappings: true,
      mapping: { action_source: { '@path': '$.properties.action_source' } }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"user_data\\":{\\"external_id\\":\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\",\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"contents\\":[{\\"id\\":\\"123\\",\\"quantity\\":1,\\"item_price\\":100},{\\"id\\":\\"345\\",\\"quantity\\":2,\\"item_price\\":50}]}}]}"`
    )
  })

  it('should throw an error when currency and value are missing', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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

    await expect(
      testDestination.testAction('purchase', {
        event,
        settings,
        mapping: {
          action_source: {
            '@path': '$.properties.action_source'
          },
          event_time: {
            '@path': '$.timestamp'
          },
          user_data: {
            email: {
              '@path': '$.properties.context.traits.email'
            }
          }
        },
        useDefaultMappings: false
      })
    ).rejects.toThrowError(
      "The root value is missing the required field 'currency'. The root value is missing the required field 'value'."
    )
  })

  it('should throw an error if no user_data keys are included', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

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

    await expect(
      testDestination.testAction('purchase', {
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
      })
    ).rejects.toThrowError("The root value is missing the required field 'user_data'.")
  })

  it('should send test_event_code if present in settings', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settingsWithTestEventCode.pixelId}`)
      .post(`/events`)
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
        contents: [
          { id: 'ABC123', quantity: 2 },
          { id: 'XYZ789', quantity: 3 }
        ],
        content_ids: ['ABC123', 'XYZ789'],
        num_items: 2
      }
    })

    const responses = await testDestination.testAction('purchase', {
      event,
      settings: settingsWithTestEventCode,
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

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"content_ids\\":[\\"ABC123\\",\\"XYZ789\\"],\\"content_name\\":\\"Shoes\\",\\"content_type\\":\\"product\\",\\"contents\\":[{\\"id\\":\\"ABC123\\",\\"quantity\\":2},{\\"id\\":\\"XYZ789\\",\\"quantity\\":3}],\\"num_items\\":2}}],\\"test_event_code\\":\\"1234567890\\"}"`
    )
  })
})
