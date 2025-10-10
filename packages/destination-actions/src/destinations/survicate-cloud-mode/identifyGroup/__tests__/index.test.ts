import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('SurvicateCloudMode.identifyGroup', () => {
  const settings = {
    workspaceKey: 'test-workspace-key',
    apiKey: 'test-api-key'
  }

  beforeEach(() => {
    nock.cleanAll()
  })

  it('should identify a group with groupId and traits', async () => {
    const event = createTestEvent({
      type: 'group',
      groupId: 'group123',
      traits: {
        name: 'Test Group',
        industry: 'Technology',
        size: '50-100'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/group')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('identifyGroup', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should prefix group traits with "group_"', async () => {
    const event = createTestEvent({
      type: 'group',
      groupId: 'group123',
      traits: {
        name: 'Test Group',
        industry: 'Technology'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/group')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('identifyGroup', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })

  it('should throw error when groupId is not provided', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'Test Group',
        industry: 'Technology'
      }
    })

    await expect(
      testDestination.testAction('identifyGroup', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Group ID is required')
  })

  it('should throw error when traits are not provided', async () => {
    const event = createTestEvent({
      type: 'group',
      groupId: 'group123'
    })

    await expect(
      testDestination.testAction('identifyGroup', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Traits are required')
  })

  it('should handle empty traits object', async () => {
    const event = createTestEvent({
      type: 'group',
      groupId: 'group123',
      traits: {}
    })

    await expect(
      testDestination.testAction('identifyGroup', {
        event,
        settings,
        useDefaultMappings: true
      })
    ).rejects.toThrow('Traits are required')
  })

  it('should handle group with minimal traits', async () => {
    const event = createTestEvent({
      type: 'group',
      groupId: 'group123',
      traits: {
        name: 'Test Group'
      }
    })

    nock('https://panel-api.survicate.com')
      .post('/integrations-api/endpoint/segment/group')
      .matchHeader('authorization', 'Bearer test-api-key')
      .reply(200, { success: true })

    const responses = await testDestination.testAction('identifyGroup', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toEqual({ success: true })
  })
})
