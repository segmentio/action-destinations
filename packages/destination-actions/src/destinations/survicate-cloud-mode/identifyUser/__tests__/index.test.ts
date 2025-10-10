import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('SurvicateCloudMode.identifyUser', () => {
  const settings = {
    workspaceKey: 'test-workspace-key',
    apiKey: 'test-api-key'
  }

  beforeEach(() => {
    nock.cleanAll()
  })

  it('should identify a user with userId and traits', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com',
        name: 'Test User',
        company: 'Test Company'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/identify')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should identify a user with anonymousId and traits', async () => {
    const event = createTestEvent({
      type: 'identify',
      anonymousId: 'anon123',
      traits: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/identify')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should identify a user with both userId and anonymousId', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      anonymousId: 'anon123',
      traits: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/identify')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should throw error when neither userId nor anonymousId is provided', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'test@example.com',
        name: 'Test User'
      }
    })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('User ID or Anonymous ID is required')
  })

  it('should throw error when traits are not provided', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user123'
    })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Traits are required')
  })

  it('should handle empty traits object', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {}
    })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Traits are required')
  })
})
