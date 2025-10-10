import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('SurvicateCloudMode.trackEvent', () => {
  const settings = {
    workspaceKey: 'test-workspace-key',
    apiKey: 'test-api-key'
  }

  beforeEach(() => {
    nock.cleanAll()
  })

  it('should track an event with userId', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user123',
      properties: {
        testProperty: 'testValue'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/track')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should track an event with anonymousId', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      anonymousId: 'anon123',
      properties: {
        testProperty: 'testValue'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/track')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should track an event without properties', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event',
      userId: 'user123'
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/track')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should throw error when neither userId nor anonymousId is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      event: 'Test Event'
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('User ID or Anonymous ID is required')
  })

  it('should throw error when event name is not provided', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'user123'
    })

    await expect(
      testDestination.testAction('trackEvent', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Name is required')
  })
})
