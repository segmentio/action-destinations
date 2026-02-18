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
        num_items: 2,
        partner_name: 'liveramp',
        partner_id: 'faf12efasdfasdf1edasdasdfadf='
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
          },
          partner_id: {
            '@path': '$.properties.partner_id'
          },
          partner_name: {
            '@path': '$.properties.partner_name'
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
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\",\\"partner_id\\":\\"faf12efasdfasdf1edasdasdfadf=\\",\\"partner_name\\":\\"liveramp\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"content_ids\\":[\\"ABC123\\",\\"XYZ789\\"],\\"content_name\\":\\"Shoes\\",\\"content_type\\":\\"product\\",\\"contents\\":[{\\"id\\":\\"ABC123\\",\\"quantity\\":2},{\\"id\\":\\"XYZ789\\",\\"quantity\\":3}],\\"num_items\\":2}}]}"`
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
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"event_source_url\\":\\"https://segment.com/academy/\\",\\"event_id\\":\\"test\\",\\"user_data\\":{\\"external_id\\":[\\"831c237928e6212bedaa4451a514ace3174562f6761f6a157a2fe5082b36e2fb\\"],\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"contents\\":[{\\"id\\":\\"123\\",\\"quantity\\":1,\\"item_price\\":100},{\\"id\\":\\"345\\",\\"quantity\\":2,\\"item_price\\":50}]}}]}"`
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

  it('should send test_event_code if present in the mapping', async () => {
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
        num_items: 2,
        test_event_code: '2345678901'
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
        },
        test_event_code: {
          '@path': '$.properties.test_event_code'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)

    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"content_ids\\":[\\"ABC123\\",\\"XYZ789\\"],\\"content_name\\":\\"Shoes\\",\\"content_type\\":\\"product\\",\\"contents\\":[{\\"id\\":\\"ABC123\\",\\"quantity\\":2},{\\"id\\":\\"XYZ789\\",\\"quantity\\":3}],\\"num_items\\":2}}],\\"test_event_code\\":\\"2345678901\\"}"`
    )
  })

  it('should handle a basic event with mutiple external Ids', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '1631210063',
      properties: {
        externalIds: ['abc123', 'xyz123'],
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
        num_items: 2,
        partner_name: 'liveramp',
        partner_id: 'faf12efasdfasdf1edasdasdfadf='
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
          externalId: {
            '@path': '$.properties.externalIds'
          },
          email: {
            '@path': '$.properties.email'
          },
          partner_id: {
            '@path': '$.properties.partner_id'
          },
          partner_name: {
            '@path': '$.properties.partner_name'
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
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210063\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380\\",\\"external_id\\":[\\"6ca13d52ca70c883e0f0bb101e425a89e8624de51db2d2392593af6a84118090\\",\\"f0a72890897acefdb2c6c8c06134339a73cc6205833ca38dba6f9fdc94b60596\\"],\\"partner_id\\":\\"faf12efasdfasdf1edasdasdfadf=\\",\\"partner_name\\":\\"liveramp\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12,\\"content_ids\\":[\\"ABC123\\",\\"XYZ789\\"],\\"content_name\\":\\"Shoes\\",\\"content_type\\":\\"product\\",\\"contents\\":[{\\"id\\":\\"ABC123\\",\\"quantity\\":2},{\\"id\\":\\"XYZ789\\",\\"quantity\\":3}],\\"num_items\\":2}}]}"`
    )
  })

  it('should handle net_revenue field', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
      .post(`/events`, {
        data: [
          {
            event_name: 'Purchase',
            event_time: '2021-09-09T19:14:23Z',
            action_source: 'email',
            user_data: {
              em: 'eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380'
            },
            custom_data: {
              currency: 'USD',
              value: 12.12,
              net_revenue: 10.5,
              content_ids: ['ABC123', 'XYZ789'],
              content_name: 'Shoes',
              content_type: 'product',
              contents: [
                { id: 'ABC123', quantity: 2 },
                { id: 'XYZ789', quantity: 3 }
              ],
              num_items: 2
            }
          }
        ]
      })
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        net_revenue: 10.5,
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
        net_revenue: {
          '@path': '$.properties.net_revenue'
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

  it('should handle predicted_ltv field', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
      .post(`/events`, {
        data: [
          {
            event_name: 'Purchase',
            event_time: '2021-09-09T19:14:23Z',
            action_source: 'email',
            user_data: {
              em: 'eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380'
            },
            custom_data: {
              currency: 'USD',
              value: 12.12,
              order_id: 'order_123',
              predicted_ltv: 150.0
            }
          }
        ]
      })
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        predicted_ltv: 150.0,
        email: 'nicholas.aguilar@segment.com',
        order_id: 'order_123'
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
        predicted_ltv: {
          '@path': '$.properties.predicted_ltv'
        },
        order_id: {
          '@path': '$.properties.order_id'
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
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })

  it('should handle both net_revenue and predicted_ltv fields', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
      .post(`/events`, {
        data: [
          {
            event_name: 'Purchase',
            event_time: '2021-09-09T19:14:23Z',
            action_source: 'email',
            user_data: {
              em: 'eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380'
            },
            custom_data: {
              currency: 'USD',
              value: 12.12,
              order_id: 'order_123',
              net_revenue: 10.5,
              predicted_ltv: 150.0
            }
          }
        ]
      })
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        net_revenue: 10.5,
        predicted_ltv: 150.0,
        email: 'nicholas.aguilar@segment.com',
        order_id: 'order_123'
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
        net_revenue: {
          '@path': '$.properties.net_revenue'
        },
        predicted_ltv: {
          '@path': '$.properties.predicted_ltv'
        },
        order_id: {
          '@path': '$.properties.order_id'
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
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })

  it('should convert to AppendValue event when is_append_event is true', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
      .post(`/events`, {
        data: [
          {
            event_name: 'AppendValue',
            event_time: '2021-09-09T19:14:23Z',
            action_source: 'email',
            user_data: {
              em: 'eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380'
            },
            custom_data: {
              currency: 'USD',
              value: 12.12,
              net_revenue: 10.5,
              predicted_ltv: 150.0
            },
            original_event_data: {
              event_name: 'Purchase',
              event_time: '2021-09-09T16:26:40Z',
              order_id: 'original_order_123',
              event_id: 'original_event_123'
            }
          }
        ]
      })
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'nicholas.aguilar@segment.com',
        is_append_event: true,
        append_event_details: {
          original_event_time: '2021-09-09T16:26:40Z',
          original_event_order_id: 'original_order_123',
          original_event_id: 'original_event_123',
          net_revenue_to_append: 10.5,
          predicted_ltv_to_append: 150.0
        }
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
        is_append_event: {
          '@path': '$.properties.is_append_event'
        },
        append_event_details: {
          original_event_time: {
            '@path': '$.properties.append_event_details.original_event_time'
          },
          original_event_order_id: {
            '@path': '$.properties.append_event_details.original_event_order_id'
          },
          original_event_id: {
            '@path': '$.properties.append_event_details.original_event_id'
          },
          net_revenue_to_append: {
            '@path': '$.properties.append_event_details.net_revenue_to_append'
          },
          predicted_ltv_to_append: {
            '@path': '$.properties.append_event_details.predicted_ltv_to_append'
          }
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
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })

  it('should convert to AppendValue event with only net_revenue', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
      .post(`/events`, {
        data: [
          {
            event_name: 'AppendValue',
            event_time: '2021-09-09T19:14:23Z',
            action_source: 'email',
            user_data: {
              em: 'eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380'
            },
            custom_data: {
              currency: 'USD',
              value: 12.12,
              net_revenue: 10.5
            },
            original_event_data: {
              event_name: 'Purchase',
              order_id: 'original_order_123'
            }
          }
        ]
      })
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'nicholas.aguilar@segment.com',
        is_append_event: true,
        append_event_details: {
          original_event_order_id: 'original_order_123',
          net_revenue_to_append: 10.5
        }
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
        is_append_event: {
          '@path': '$.properties.is_append_event'
        },
        append_event_details: {
          original_event_order_id: {
            '@path': '$.properties.append_event_details.original_event_order_id'
          },
          net_revenue_to_append: {
            '@path': '$.properties.append_event_details.net_revenue_to_append'
          }
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
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })

  it('should convert to AppendValue event with only predicted_ltv', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
      .post(`/events`, {
        data: [
          {
            event_name: 'AppendValue',
            event_time: '2021-09-09T19:14:23Z',
            action_source: 'email',
            user_data: {
              em: 'eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380'
            },
            custom_data: {
              currency: 'USD',
              value: 12.12,
              predicted_ltv: 150.0
            },
            original_event_data: {
              event_name: 'Purchase',
              event_id: 'original_event_123'
            }
          }
        ]
      })
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'nicholas.aguilar@segment.com',
        is_append_event: true,
        append_event_details: {
          original_event_id: 'original_event_123',
          predicted_ltv_to_append: 150.0
        }
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
        is_append_event: {
          '@path': '$.properties.is_append_event'
        },
        append_event_details: {
          original_event_id: {
            '@path': '$.properties.append_event_details.original_event_id'
          },
          predicted_ltv_to_append: {
            '@path': '$.properties.append_event_details.predicted_ltv_to_append'
          }
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
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })

  it('should fail validation when is_append_event is true but no original event identifiers provided', async () => {
    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'nicholas.aguilar@segment.com',
        is_append_event: true,
        append_event_details: {
          net_revenue_to_append: 10.5
        }
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
          is_append_event: {
            '@path': '$.properties.is_append_event'
          },
          append_event_details: {
            net_revenue_to_append: {
              '@path': '$.properties.append_event_details.net_revenue_to_append'
            }
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
          }
        }
      })
    ).rejects.toThrowError(
      'If append event is true, one of "Append Event Details > Original Event ID" or "Append Event Details > Original Order ID" must be provided.'
    )
  })

  it('should fail validation when is_append_event is true but no original event append values provided', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'nicholas.aguilar@segment.com',
        is_append_event: true,
        append_event_details: {
          original_event_id: 'original_event_123'
        }
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
          is_append_event: {
            '@path': '$.properties.is_append_event'
          },
          append_event_details: {
            original_event_id: {
              '@path': '$.properties.append_event_details.original_event_id'
            }
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
          }
        }
      })
    ).rejects.toThrowError(
      'If append event is true, at least one of "Append Event Details > Net Revenue" or "Append Event Details > Predicted Lifetime Value" must be provided as a number'
    )
  })

  it('should preserve custom_data fields when converting to AppendValue', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
      .post(`/events`, {
        data: [
          {
            event_name: 'AppendValue',
            event_time: '2021-09-09T19:14:23Z',
            action_source: 'email',
            user_data: {
              em: 'eeaf810ee0e3cef3307089f22c3804f54c79eed19ef29bf70df864b43862c380'
            },
            custom_data: {
              currency: 'USD',
              value: 12.12,
              content_ids: ['ABC123', 'XYZ789'],
              content_name: 'Shoes',
              net_revenue: 10.5
            },
            original_event_data: {
              event_name: 'Purchase',
              order_id: 'original_order_123'
            }
          }
        ]
      })
      .reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '2021-09-09T19:14:23Z',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'nicholas.aguilar@segment.com',
        content_ids: ['ABC123', 'XYZ789'],
        content_name: 'Shoes',
        is_append_event: true,
        append_event_details: {
          original_event_order_id: 'original_order_123',
          net_revenue_to_append: 10.5
        }
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
        content_ids: {
          '@path': '$.properties.content_ids'
        },
        content_name: {
          '@path': '$.properties.content_name'
        },
        is_append_event: {
          '@path': '$.properties.is_append_event'
        },
        append_event_details: {
          original_event_order_id: {
            '@path': '$.properties.append_event_details.original_event_order_id'
          },
          net_revenue_to_append: {
            '@path': '$.properties.append_event_details.net_revenue_to_append'
          }
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
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
  })

  it('should include ctwa_clid in user_data', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    const event = createTestEvent({
      event: 'Order Completed',
      userId: 'abc123',
      timestamp: '1631210000',
      properties: {
        action_source: 'email',
        currency: 'USD',
        value: 12.12,
        email: 'test@example.com',
        ctwa_clid: 'test_ctwa_click_id_12345'
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
          },
          ctwa_clid: {
            '@path': '$.properties.ctwa_clid'
          }
        },
        action_source: {
          '@path': '$.properties.action_source'
        },
        event_time: {
          '@path': '$.timestamp'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"data\\":[{\\"event_name\\":\\"Purchase\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b\\",\\"ctwa_clid\\":\\"test_ctwa_click_id_12345\\"},\\"custom_data\\":{\\"currency\\":\\"USD\\",\\"value\\":12.12}}]}"`
    )
  })
})
