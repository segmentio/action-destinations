import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../constants'

const testDestination = createTestIntegration(Destination)
const settings = {
  pixelId: '123321',
  testEventCode: '',
  token: process.env.TOKEN
}
const settingsWithTestEventCode = {
  pixelId: '123321',
  testEventCode: '1234567890',
  token: process.env.TOKEN
}

describe('FacebookConversionsApi', () => {
  describe('Custom', () => {
    it('should fail if no event_name is passed', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'email',
          currency: 'FAKE',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(
        testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            action_source: { '@path': '$.properties.action_source' }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'event_time'.")
    })

    it('should fail if an empty event_name is passed', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: '',
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'email',
          currency: 'FAKE',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(
        testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            action_source: { '@path': '$.properties.action_source' }
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'event_time'.")
    })

    it('should throw an error for an invalid action_source', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        event: 'custom',
        userId: 'abc123',
        timestamp: '1631210010',
        properties: {
          action_source: 'fake',
          currency: 'USD',
          value: 12.12,
          email: 'nicholas.aguilar@segment.com'
        }
      })

      await expect(
        testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            action_source: {
              '@path': '$.properties.action_source'
            },
            event_time: {
              '@path': '$.timestamp'
            }
          }
        })
      ).rejects.toThrowError('a')
    })

    it('should map a standard identify event to a custom event', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        anonymousId: '507f191e810c19729de860ea',
        context: {
          ip: '8.8.8.8',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36'
        },
        messageId: '022bb90c-bbac-11e4-8dfc-aa07a5b093db',
        receivedAt: '2015-02-23T22:28:55.387Z',
        sentAt: '2015-02-23T22:28:55.111Z',
        timestamp: '2015-02-23T22:28:55.111Z',
        traits: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
          plan: 'premium',
          logins: 5,
          address: {
            street: '6th St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'USA'
          },
          partner_name: 'liveramp',
          partner_id: 'faf12efasdfasdf1edasdasdfadf='
        },
        properties: {
          action_source: 'website',
          timestamp: '1633473963'
        },
        type: 'identify',
        userId: '97980cfea0067',
        event: 'identify'
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          custom_data: { '@path': '$.properties' },
          user_data: {
            partner_id: {
              '@path': '$.traits.partner_id'
            },
            partner_name: {
              '@path': '$.traits.partner_name'
            }
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"identify\\",\\"event_time\\":\\"2015-02-23T22:28:55.111Z\\",\\"action_source\\":\\"website\\",\\"event_id\\":\\"022bb90c-bbac-11e4-8dfc-aa07a5b093db\\",\\"user_data\\":{\\"partner_id\\":\\"faf12efasdfasdf1edasdasdfadf=\\",\\"partner_name\\":\\"liveramp\\"},\\"custom_data\\":{\\"action_source\\":\\"website\\",\\"timestamp\\":\\"1633473963\\"}}]}"`
      )
    })

    it('should send test_event_code if present in settings', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settingsWithTestEventCode.pixelId}`)
        .post(`/events`)
        .reply(201, {})

      const event = createTestEvent({
        anonymousId: '507f191e810c19729de860ea',
        context: {
          ip: '8.8.8.8',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36'
        },
        messageId: '022bb90c-bbac-11e4-8dfc-aa07a5b093db',
        receivedAt: '2015-02-23T22:28:55.387Z',
        sentAt: '2015-02-23T22:28:55.111Z',
        timestamp: '2015-02-23T22:28:55.111Z',
        traits: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
          plan: 'premium',
          logins: 5,
          address: {
            street: '6th St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'USA'
          }
        },
        properties: {
          action_source: 'website',
          timestamp: '1633473963'
        },
        type: 'identify',
        userId: '97980cfea0067',
        event: 'identify'
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings: settingsWithTestEventCode,
        useDefaultMappings: true,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          custom_data: { '@path': '$.properties' }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"identify\\",\\"event_time\\":\\"2015-02-23T22:28:55.111Z\\",\\"action_source\\":\\"website\\",\\"event_id\\":\\"022bb90c-bbac-11e4-8dfc-aa07a5b093db\\",\\"user_data\\":{\\"external_id\\":[\\"df73b86ff613b9d7008c175ae3c3aa3f2c1ea1674a80cac85274d58048e44127\\"],\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36\\"},\\"custom_data\\":{\\"action_source\\":\\"website\\",\\"timestamp\\":\\"1633473963\\"}}],\\"test_event_code\\":\\"1234567890\\"}"`
      )
    })

    it('should send test_event_code if present in the mapping', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

      const event = createTestEvent({
        anonymousId: '507f191e810c19729de860ea',
        context: {
          ip: '8.8.8.8',
          userAgent:
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36'
        },
        messageId: '022bb90c-bbac-11e4-8dfc-aa07a5b093db',
        receivedAt: '2015-02-23T22:28:55.387Z',
        sentAt: '2015-02-23T22:28:55.111Z',
        timestamp: '2015-02-23T22:28:55.111Z',
        traits: {
          name: 'Peter Gibbons',
          email: 'peter@example.com',
          plan: 'premium',
          logins: 5,
          address: {
            street: '6th St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94103',
            country: 'USA'
          }
        },
        properties: {
          action_source: 'website',
          timestamp: '1633473963',
          test_event_code: '2345678901'
        },
        type: 'identify',
        userId: '97980cfea0067',
        event: 'identify'
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings: settingsWithTestEventCode,
        useDefaultMappings: true,
        mapping: {
          action_source: { '@path': '$.properties.action_source' },
          custom_data: { '@path': '$.properties' },
          test_event_code: {
            '@path': '$.properties.test_event_code'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"data\\":[{\\"event_name\\":\\"identify\\",\\"event_time\\":\\"2015-02-23T22:28:55.111Z\\",\\"action_source\\":\\"website\\",\\"event_id\\":\\"022bb90c-bbac-11e4-8dfc-aa07a5b093db\\",\\"user_data\\":{\\"external_id\\":[\\"df73b86ff613b9d7008c175ae3c3aa3f2c1ea1674a80cac85274d58048e44127\\"],\\"client_ip_address\\":\\"8.8.8.8\\",\\"client_user_agent\\":\\"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.115 Safari/537.36\\"},\\"custom_data\\":{\\"action_source\\":\\"website\\",\\"timestamp\\":\\"1633473963\\",\\"test_event_code\\":\\"2345678901\\"}}],\\"test_event_code\\":\\"2345678901\\"}"`
      )
    })

    it('should convert custom event to AppendValue when is_append_event is true', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
        .post(`/events`, {
          data: [
            {
              event_name: 'AppendValue',
              event_time: '2021-09-09T19:14:23Z',
              action_source: 'email',
              user_data: {
                em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
              },
              custom_data: {
                custom_property: 'custom_value',
                another_custom_property: 12345,
                net_revenue: 10.5,
                predicted_ltv: 150.0
              },
              original_event_data: {
                event_name: 'Custom LTV Update',
                event_time: '2021-09-09T16:26:40Z',
                order_id: 'original_order_123',
                event_id: 'original_event_123'
              }
            }
          ]
        })
        .reply(201, {})

      const event = createTestEvent({
        event: 'Custom LTV Update',
        userId: 'abc123',
        timestamp: '2021-09-09T19:14:23Z',
        properties: {
          action_source: 'email',
          email: 'test@example.com',
          is_append_event: true,
          append_event_details: {
            original_event_time: '2021-09-09T16:26:40Z',
            original_event_order_id: 'original_order_123',
            original_event_id: 'original_event_123',
            net_revenue_to_append: 10.5,
            predicted_ltv_to_append: 150.0
          },
          custom_data: {
            custom_property: 'custom_value',
            another_custom_property: 12345
          }
        }
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings,
        mapping: {
          event_name: {
            '@path': '$.event'
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
          custom_data: {
            '@path': '$.properties.custom_data'
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

    it('should convert custom event to AppendValue with minimal fields', async () => {
      nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`)
        .post(`/events`, {
          data: [
            {
              event_name: 'AppendValue',
              event_time: '2021-09-09T19:14:23Z',
              action_source: 'email',
              user_data: {
                em: '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'
              },
              custom_data: {
                net_revenue: 25.75
              },
              original_event_data: {
                event_name: 'Revenue Update',
                event_id: 'original_event_456'
              }
            }
          ]
        })
        .reply(201, {})

      const event = createTestEvent({
        event: 'Revenue Update',
        userId: 'abc123',
        timestamp: '2021-09-09T19:14:23Z',
        properties: {
          action_source: 'email',
          email: 'test@example.com',
          is_append_event: true,
          append_event_details: {
            original_event_id: 'original_event_456',
            net_revenue_to_append: 25.75
          }
        }
      })

      const responses = await testDestination.testAction('custom', {
        event,
        settings,
        mapping: {
          event_name: {
            '@path': '$.event'
          },
          is_append_event: {
            '@path': '$.properties.is_append_event'
          },
          append_event_details: {
            original_event_id: {
              '@path': '$.properties.append_event_details.original_event_id'
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

    it('should fail validation for custom event when is_append_event is true but no identifiers', async () => {
      const event = createTestEvent({
        event: 'LTV Update',
        userId: 'abc123',
        timestamp: '2021-09-09T19:14:23Z',
        properties: {
          action_source: 'email',
          email: 'test@example.com',
          is_append_event: true,
          append_event_details: {
            predicted_ltv_to_append: 200.0
          }
        }
      })

      await expect(
        testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            is_append_event: {
              '@path': '$.properties.is_append_event'
            },
            append_event_details: {
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
      ).rejects.toThrowError(
        'If append event is true, one of "Append Event Details > Original Event ID" or "Append Event Details > Original Order ID" must be provided.'
      )
    })

    it('should fail validation for custom event when is_append_event is true but no append values', async () => {
      const event = createTestEvent({
        event: 'Empty Append',
        userId: 'abc123',
        timestamp: '2021-09-09T19:14:23Z',
        properties: {
          action_source: 'email',
          email: 'test@example.com',
          is_append_event: true,
          append_event_details: {
            original_event_order_id: 'order_789'
          }
        }
      })

      await expect(
        testDestination.testAction('custom', {
          event,
          settings,
          mapping: {
            event_name: {
              '@path': '$.event'
            },
            is_append_event: {
              '@path': '$.properties.is_append_event'
            },
            append_event_details: {
              original_event_order_id: {
                '@path': '$.properties.append_event_details.original_event_order_id'
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
  })

  it('should include ctwa_clid in user_data', async () => {
    nock(`https://graph.facebook.com/v${API_VERSION}/${settings.pixelId}`).post(`/events`).reply(201, {})

    const event = createTestEvent({
      event: 'custom_event',
      userId: 'abc123',
      timestamp: '1631210000',
      properties: {
        action_source: 'email',
        ctwa_clid: 'test_ctwa_click_id_12345'
      },
      context: {
        traits: {
          email: 'test@example.com'
        }
      }
    })

    const responses = await testDestination.testAction('custom', {
      event,
      settings,
      mapping: {
        event_name: {
          '@path': '$.event'
        },
        action_source: {
          '@path': '$.properties.action_source'
        },
        event_time: {
          '@path': '$.timestamp'
        },
        user_data: {
          email: {
            '@path': '$.context.traits.email'
          },
          ctwa_clid: {
            '@path': '$.properties.ctwa_clid'
          }
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(201)
    expect(responses[0].options.body).toMatchInlineSnapshot(
      `"{\\"data\\":[{\\"event_name\\":\\"custom_event\\",\\"event_time\\":\\"1631210000\\",\\"action_source\\":\\"email\\",\\"user_data\\":{\\"em\\":\\"973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b\\",\\"ctwa_clid\\":\\"test_ctwa_click_id_12345\\"},\\"custom_data\\":{}}]}"`
    )
  })
})
