import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com'
}

describe('Braze.mergeUsers', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should merge users with external_id identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({
      type: 'track',
      userId: 'user-to-keep-123'
    })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        identifier_to_merge: {
          external_id: 'user-to-merge-456'
        },
        identifier_to_keep: {
          external_id: 'user-to-keep-123'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({ message: 'success' })
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: {
            external_id: 'user-to-merge-456'
          },
          identifier_to_keep: {
            external_id: 'user-to-keep-123'
          }
        }
      ]
    })
  })

  it('should merge users with user_alias identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({
      type: 'track'
    })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        identifier_to_merge: {
          user_alias: {
            alias_name: 'merge-alias',
            alias_label: 'segment'
          }
        },
        identifier_to_keep: {
          user_alias: {
            alias_name: 'keep-alias',
            alias_label: 'segment'
          }
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: {
            user_alias: {
              alias_name: 'merge-alias',
              alias_label: 'segment'
            }
          },
          identifier_to_keep: {
            user_alias: {
              alias_name: 'keep-alias',
              alias_label: 'segment'
            }
          }
        }
      ]
    })
  })

  it('should merge users with email identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({
      type: 'track'
    })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        identifier_to_merge: {
          email: 'merge@example.com'
        },
        identifier_to_keep: {
          email: 'keep@example.com'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: {
            email: 'merge@example.com'
          },
          identifier_to_keep: {
            email: 'keep@example.com'
          }
        }
      ]
    })
  })

  it('should merge users with braze_id identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({
      type: 'track'
    })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        identifier_to_merge: {
          braze_id: 'braze-merge-id-123'
        },
        identifier_to_keep: {
          braze_id: 'braze-keep-id-456'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: {
            braze_id: 'braze-merge-id-123'
          },
          identifier_to_keep: {
            braze_id: 'braze-keep-id-456'
          }
        }
      ]
    })
  })

  it('should merge users with phone identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({
      type: 'track'
    })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        identifier_to_merge: {
          phone: '+14155551234'
        },
        identifier_to_keep: {
          phone: '+14155555678'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: {
            phone: '+14155551234'
          },
          identifier_to_keep: {
            phone: '+14155555678'
          }
        }
      ]
    })
  })

  it('should merge users with mixed identifier types', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({
      type: 'track',
      userId: 'user-to-keep-123'
    })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        identifier_to_merge: {
          email: 'merge@example.com'
        },
        identifier_to_keep: {
          external_id: 'user-to-keep-123'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: {
            email: 'merge@example.com'
          },
          identifier_to_keep: {
            external_id: 'user-to-keep-123'
          }
        }
      ]
    })
  })

  it('should throw error when identifier_to_merge has no valid identifier', async () => {
    const event = createTestEvent({
      type: 'track'
    })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings,
        mapping: {
          identifier_to_merge: {},
          identifier_to_keep: {
            external_id: 'user-to-keep-123'
          }
        }
      })
    ).rejects.toThrowError(
      'Identifier to Merge must specify one of: external_id, user_alias, braze_id, email, or phone.'
    )
  })

  it('should throw error when identifier_to_keep has no valid identifier', async () => {
    const event = createTestEvent({
      type: 'track'
    })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings,
        mapping: {
          identifier_to_merge: {
            external_id: 'user-to-merge-456'
          },
          identifier_to_keep: {}
        }
      })
    ).rejects.toThrowError(
      'Identifier to Keep must specify one of: external_id, user_alias, braze_id, email, or phone.'
    )
  })

  it('should handle incomplete user_alias (missing required fields)', async () => {
    const event = createTestEvent({
      type: 'track'
    })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings,
        mapping: {
          identifier_to_merge: {
            user_alias: {
              alias_name: 'test'
              // missing alias_label
            }
          },
          identifier_to_keep: {
            external_id: 'user-to-keep-123'
          }
        }
      })
    ).rejects.toThrowError(
      'Identifier to Merge must specify one of: external_id, user_alias, braze_id, email, or phone.'
    )
  })

  it('should use default mapping from userId for identifier_to_keep', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({
      type: 'track',
      userId: 'user-to-keep-123'
    })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        identifier_to_merge: {
          external_id: 'user-to-merge-456'
        },
        identifier_to_keep: {
          external_id: {
            '@path': '$.userId'
          }
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: {
            external_id: 'user-to-merge-456'
          },
          identifier_to_keep: {
            external_id: 'user-to-keep-123'
          }
        }
      ]
    })
  })
})
