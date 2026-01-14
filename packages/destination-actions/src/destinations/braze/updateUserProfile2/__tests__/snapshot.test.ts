import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'updateUserProfile2'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`
const receivedAt = '2021-08-03T17:40:04.055Z'
const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com' as const
}

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('only required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: { ...event.properties, __segment_internal_sync_mode: 'update' },
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('fails if sync mode is not update', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    const event = createTestEvent({
      properties: eventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: { ...event.properties, __segment_internal_sync_mode: 'upsert' },
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError('Sync mode upsert is not supported')
  })

  it('it should work with batched events', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    // ISO String can be obtained from new Date().toISOString()
    const isoString = '2000-01-05T12:00:00.00Z'

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {}
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'identify',
        receivedAt,
        properties: {}
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: true,
      mapping: {
        external_id: {
          '@path': '$.userId'
        },
        user_alias: {},
        braze_id: {
          '@path': '$.properties.braze_id'
        },
        name: {
          '@path': '$.event'
        },
        time: {
          '@path': '$.receivedAt'
        },
        properties: {
          '@path': '$.properties'
        },
        products: {
          '@path': '$.properties.products'
        },
        date_of_first_session: isoString,
        date_of_last_session: isoString,
        marked_email_as_spam_at: isoString,
        enable_batching: true,
        __segment_internal_sync_mode: 'update'
      },
      settings: {
        ...settings
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })

  it('it should work with a single batched events', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        receivedAt,
        properties: {}
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: true,
      mapping: {
        external_id: {
          '@path': '$.userId'
        },
        user_alias: {},
        braze_id: {
          '@path': '$.properties.braze_id'
        },
        name: {
          '@path': '$.event'
        },
        time: {
          '@path': '$.receivedAt'
        },
        properties: {
          '@path': '$.properties'
        },
        enable_batching: true,
        __segment_internal_sync_mode: 'update'
      },
      settings: {
        ...settings
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.headers).toMatchSnapshot()
    expect(responses[0].options.json).toMatchSnapshot()
  })

  it('should send subscription_groups with a single subscription group', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'test-user-123',
      traits: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: {
        external_id: 'test-user-123',
        email: 'test@example.com',
        subscription_groups: [
          {
            subscription_group_id: 'sub_group_1',
            subscription_state: 'subscribed'
          }
        ],
        __segment_internal_sync_mode: 'update'
      },
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      attributes: [
        {
          external_id: 'test-user-123',
          email: 'test@example.com',
          subscription_groups: [
            {
              subscription_group_id: 'sub_group_1',
              subscription_state: 'subscribed'
            }
          ]
        }
      ]
    })
  })

  it('should send subscription_groups with multiple subscription groups', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'test-user-456',
      traits: {
        email: 'test2@example.com'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: {
        external_id: 'test-user-456',
        email: 'test2@example.com',
        subscription_groups: [
          {
            subscription_group_id: 'sub_group_1',
            subscription_state: 'subscribed'
          },
          {
            subscription_group_id: 'sub_group_2',
            subscription_state: 'unsubscribed'
          },
          {
            subscription_group_id: 'sub_group_3',
            subscription_state: 'subscribed'
          }
        ],
        __segment_internal_sync_mode: 'update'
      },
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      attributes: [
        {
          external_id: 'test-user-456',
          email: 'test2@example.com',
          subscription_groups: [
            {
              subscription_group_id: 'sub_group_1',
              subscription_state: 'subscribed'
            },
            {
              subscription_group_id: 'sub_group_2',
              subscription_state: 'unsubscribed'
            },
            {
              subscription_group_id: 'sub_group_3',
              subscription_state: 'subscribed'
            }
          ]
        }
      ]
    })
  })

  it('should send subscription_groups in batched events', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const events: SegmentEvent[] = [
      createTestEvent({
        event: 'Test Event 1',
        type: 'identify',
        userId: 'user-1',
        receivedAt,
        properties: {}
      }),
      createTestEvent({
        event: 'Test Event 2',
        type: 'identify',
        userId: 'user-2',
        receivedAt,
        properties: {}
      })
    ]

    const responses = await testDestination.testBatchAction(actionSlug, {
      events,
      useDefaultMappings: true,
      mapping: {
        external_id: {
          '@path': '$.userId'
        },
        subscription_groups: [
          {
            subscription_group_id: 'newsletter_group',
            subscription_state: 'subscribed'
          }
        ],
        enable_batching: true,
        __segment_internal_sync_mode: 'update'
      },
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      attributes: [
        {
          external_id: 'user-1',
          subscription_groups: [
            {
              subscription_group_id: 'newsletter_group',
              subscription_state: 'subscribed'
            }
          ]
        },
        {
          external_id: 'user-2',
          subscription_groups: [
            {
              subscription_group_id: 'newsletter_group',
              subscription_state: 'subscribed'
            }
          ]
        }
      ]
    })
  })

  it('should work without subscription_groups when not provided', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'test-user-789',
      traits: {
        email: 'test3@example.com',
        firstName: 'John'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: {
        external_id: 'test-user-789',
        email: 'test3@example.com',
        first_name: 'John',
        __segment_internal_sync_mode: 'update'
      },
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      attributes: [
        {
          external_id: 'test-user-789',
          email: 'test3@example.com',
          first_name: 'John'
        }
      ]
    })
    // Verify subscription_groups is not present or is undefined
    expect(responses[0].options.json?.attributes[0].subscription_groups).toBeUndefined()
  })

  it('should send subscription_groups with both subscribed and unsubscribed states', async () => {
    nock('https://rest.iad-01.braze.com').post('/users/track').reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'test-user-mixed',
      traits: {
        email: 'mixed@example.com'
      }
    })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: {
        external_id: 'test-user-mixed',
        email: 'mixed@example.com',
        first_name: 'Jane',
        subscription_groups: [
          {
            subscription_group_id: 'promotional_emails',
            subscription_state: 'unsubscribed'
          },
          {
            subscription_group_id: 'transactional_emails',
            subscription_state: 'subscribed'
          }
        ],
        __segment_internal_sync_mode: 'update'
      },
      settings
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      attributes: [
        {
          external_id: 'test-user-mixed',
          email: 'mixed@example.com',
          first_name: 'Jane',
          subscription_groups: [
            {
              subscription_group_id: 'promotional_emails',
              subscription_state: 'unsubscribed'
            },
            {
              subscription_group_id: 'transactional_emails',
              subscription_state: 'subscribed'
            }
          ]
        }
      ]
    })
  })
})
