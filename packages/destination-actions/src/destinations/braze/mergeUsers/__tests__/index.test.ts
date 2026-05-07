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

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'external_id',
        previousIdValue: 'user-to-merge-456',
        keepIdType: 'external_id',
        keepIdValue: 'user-to-keep-123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({ message: 'success' })
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { external_id: 'user-to-merge-456' },
          identifier_to_keep: { external_id: 'user-to-keep-123' }
        }
      ]
    })
  })

  it('should merge users with user_alias identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'user_alias',
        previousAliasIdValue: { alias_name: 'merge-alias', alias_label: 'segment' },
        keepIdType: 'user_alias',
        keepAliasIdValue: { alias_name: 'keep-alias', alias_label: 'segment' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { user_alias: { alias_name: 'merge-alias', alias_label: 'segment' } },
          identifier_to_keep: { user_alias: { alias_name: 'keep-alias', alias_label: 'segment' } }
        }
      ]
    })
  })

  it('should merge users with email identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'email',
        previousIdValue: 'merge@example.com',
        previousIdPrioritization: 'identified',
        keepIdType: 'email',
        keepIdValue: 'keep@example.com',
        keepIdPrioritization: 'identified'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { email: 'merge@example.com', prioritization: ['identified'] },
          identifier_to_keep: { email: 'keep@example.com', prioritization: ['identified'] }
        }
      ]
    })
  })

  it('should merge users with phone identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'phone',
        previousIdValue: '+14155551234',
        previousIdPrioritization: 'identified',
        keepIdType: 'phone',
        keepIdValue: '+14155555678',
        keepIdPrioritization: 'identified'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { phone: '+14155551234', prioritization: ['identified'] },
          identifier_to_keep: { phone: '+14155555678', prioritization: ['identified'] }
        }
      ]
    })
  })

  it('should merge users with mixed identifier types', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'email',
        previousIdValue: 'merge@example.com',
        previousIdPrioritization: 'identified',
        keepIdType: 'external_id',
        keepIdValue: 'user-to-keep-123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { email: 'merge@example.com', prioritization: ['identified'] },
          identifier_to_keep: { external_id: 'user-to-keep-123' }
        }
      ]
    })
  })

  it('should merge users with user_alias to merge and external_id to keep', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'user_alias',
        previousAliasIdValue: { alias_name: 'anon-alias', alias_label: 'segment' },
        keepIdType: 'external_id',
        keepIdValue: 'known-user-123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { user_alias: { alias_name: 'anon-alias', alias_label: 'segment' } },
          identifier_to_keep: { external_id: 'known-user-123' }
        }
      ]
    })
  })

  it('should throw error when previousIdValue is missing for a non-alias type', async () => {
    const event = createTestEvent({ type: 'alias' })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings,
        mapping: {
          previousIdType: 'external_id',
          keepIdType: 'external_id',
          keepIdValue: 'user-to-keep-123'
        }
      })
    ).rejects.toThrowError("missing the required field 'previousIdValue'")
  })

  it('should throw error when keepIdValue is missing for a non-alias type', async () => {
    const event = createTestEvent({ type: 'alias' })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings,
        mapping: {
          previousIdType: 'external_id',
          previousIdValue: 'user-to-merge-456',
          keepIdType: 'external_id'
        }
      })
    ).rejects.toThrowError("missing the required field 'keepIdValue'")
  })

  it('should throw error when previousAliasIdValue is incomplete (missing alias_label)', async () => {
    const event = createTestEvent({ type: 'alias' })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings,
        mapping: {
          previousIdType: 'user_alias',
          previousAliasIdValue: { alias_name: 'merge-alias' },
          keepIdType: 'external_id',
          keepIdValue: 'user-to-keep-123'
        }
      })
    ).rejects.toThrowError("missing the required field 'alias_label'")
  })

  it('should throw error when keepAliasIdValue is incomplete (missing alias_name)', async () => {
    const event = createTestEvent({ type: 'alias' })

    await expect(
      testDestination.testAction('mergeUsers', {
        event,
        settings,
        mapping: {
          previousIdType: 'external_id',
          previousIdValue: 'user-to-merge-456',
          keepIdType: 'user_alias',
          keepAliasIdValue: { alias_label: 'segment' }
        }
      })
    ).rejects.toThrowError("missing the required field 'alias_name'")
  })

  it('should use userId from event as keepIdValue via path mapping', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias', userId: 'user-to-keep-123' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'external_id',
        previousIdValue: 'user-to-merge-456',
        keepIdType: 'external_id',
        keepIdValue: { '@path': '$.userId' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { external_id: 'user-to-merge-456' },
          identifier_to_keep: { external_id: 'user-to-keep-123' }
        }
      ]
    })
  })

  it('should include multi-value prioritization array', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'email',
        previousIdValue: 'merge@example.com',
        previousIdPrioritization: 'identified,most_recently_updated',
        keepIdType: 'email',
        keepIdValue: 'keep@example.com',
        keepIdPrioritization: 'unidentified,least_recently_updated'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      merge_updates: [
        {
          identifier_to_merge: { email: 'merge@example.com', prioritization: ['identified', 'most_recently_updated'] },
          identifier_to_keep: { email: 'keep@example.com', prioritization: ['unidentified', 'least_recently_updated'] }
        }
      ]
    })
  })

  it('should not include prioritization when value is null', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'email',
        previousIdValue: 'merge@example.com',
        previousIdPrioritization: null,
        keepIdType: 'email',
        keepIdValue: 'keep@example.com',
        keepIdPrioritization: null
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const json = responses[0].options.json as Record<string, unknown>
    const mergeUpdates = (json.merge_updates as Array<Record<string, Record<string, unknown>>>)[0]
    expect(mergeUpdates.identifier_to_merge).not.toHaveProperty('prioritization')
    expect(mergeUpdates.identifier_to_keep).not.toHaveProperty('prioritization')
  })

  it('should not include prioritization for external_id identifiers', async () => {
    nock(settings.endpoint).post('/users/merge').reply(200, { message: 'success' })

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction('mergeUsers', {
      event,
      settings,
      mapping: {
        previousIdType: 'external_id',
        previousIdValue: 'user-to-merge-456',
        keepIdType: 'external_id',
        keepIdValue: 'user-to-keep-123'
      }
    })

    expect(responses.length).toBe(1)
    const json = responses[0].options.json as Record<string, unknown>
    const mergeUpdates = (json.merge_updates as Array<Record<string, Record<string, unknown>>>)[0]
    expect(mergeUpdates.identifier_to_merge).not.toHaveProperty('prioritization')
    expect(mergeUpdates.identifier_to_keep).not.toHaveProperty('prioritization')
  })
})
