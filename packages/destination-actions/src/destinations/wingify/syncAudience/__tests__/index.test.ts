import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const BASE_ENDPOINT = 'https://dev.visualwebsiteoptimizer.com'
const accountId = 654331

describe('Wingify.syncAudience', () => {
  it('should send the add audience call', async () => {
    const event = createTestEvent({
      event: 'Audience Entered',
      userId: 'test_user',
      properties: {
        audience_key: 'test_audience'
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=wingify_integration&a=${accountId}`).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      useDefaultMappings: true,
      settings: {
        wingifyAccountId: accountId,
        apikey: ''
      }
    })
    const expectedRequest = {
      d: {
        event: {
          name: 'wingify_integration',
          props: {
            action: 'audience_entered',
            audienceName: 'test_audience',
            audienceId: 'test_audience',
            identifier: 'test_user',
            accountId: 654331,
            integration: 'segment'
          }
        }
      }
    }
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(expectedRequest)
  })

  it('should handle anonymous users', async () => {
    const event = createTestEvent({
      event: 'Audience Entered',
      userId: null,
      anonymousId: 'anonymous-id',
      properties: {
        audience_key: 'test_audience'
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=wingify_integration&a=${accountId}`).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      useDefaultMappings: true,
      settings: {
        wingifyAccountId: accountId,
        apikey: ''
      }
    })
    const expectedRequest = {
      d: {
        event: {
          name: 'wingify_integration',
          props: {
            action: 'audience_entered',
            audienceName: 'test_audience',
            audienceId: 'test_audience',
            identifier: 'anonymous-id',
            accountId: 654331,
            integration: 'segment'
          }
        }
      }
    }
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(expectedRequest)
  })

  it('should send the remove audience call', async () => {
    const event = createTestEvent({
      event: 'Audience Exited',
      userId: 'test_user',
      properties: {
        audience_key: 'test_audience'
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=wingify_integration&a=${accountId}`).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      useDefaultMappings: true,
      settings: {
        wingifyAccountId: accountId,
        apikey: ''
      }
    })
    const expectedRequest = {
      d: {
        event: {
          name: 'wingify_integration',
          props: {
            action: 'audience_exited',
            audienceName: 'test_audience',
            audienceId: 'test_audience',
            identifier: 'test_user',
            accountId: 654331,
            integration: 'segment'
          }
        }
      }
    }
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject(expectedRequest)
  })
})
