import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const BASE_ENDPOINT = 'https://collect.wingify.net'
const WINGIFY_ACCOUNT_ID = 654331
const AUDIENCE_KEY = 'test_audience'

describe('Wingify.syncAudience', () => {
  it('should send the add audience call', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'test_user',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: AUDIENCE_KEY
        }
      },
      properties: {
        audience_key: AUDIENCE_KEY,
        [AUDIENCE_KEY]: true
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=wingify_integration&a=${WINGIFY_ACCOUNT_ID}`).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      useDefaultMappings: true,
      audienceMembership: true,
      settings: {
        wingifyAccountId: WINGIFY_ACCOUNT_ID,
        apikey: ''
      }
    })
    const expectedRequest = {
      d: {
        event: {
          name: 'wingify_integration',
          props: {
            action: 'audience_entered',
            audienceName: AUDIENCE_KEY,
            audienceId: AUDIENCE_KEY,
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
      type: 'track',
      userId: null,
      anonymousId: 'anonymous-id',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: AUDIENCE_KEY
        }
      },
      properties: {
        audience_key: AUDIENCE_KEY,
        [AUDIENCE_KEY]: true
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=wingify_integration&a=${WINGIFY_ACCOUNT_ID}`).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      useDefaultMappings: true,
      audienceMembership: true,
      settings: {
        wingifyAccountId: WINGIFY_ACCOUNT_ID,
        apikey: ''
      }
    })
    const expectedRequest = {
      d: {
        event: {
          name: 'wingify_integration',
          props: {
            action: 'audience_entered',
            audienceName: AUDIENCE_KEY,
            audienceId: AUDIENCE_KEY,
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
      type: 'track',
      userId: 'test_user',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: AUDIENCE_KEY
        }
      },
      properties: {
        audience_key: AUDIENCE_KEY,
        [AUDIENCE_KEY]: false
      }
    })
    nock(BASE_ENDPOINT).post(`/events/t?en=wingify_integration&a=${WINGIFY_ACCOUNT_ID}`).reply(200, {})
    const responses = await testDestination.testAction('syncAudience', {
      event,
      useDefaultMappings: true,
      audienceMembership: false,
      settings: {
        wingifyAccountId: WINGIFY_ACCOUNT_ID,
        apikey: ''
      }
    })
    const expectedRequest = {
      d: {
        event: {
          name: 'wingify_integration',
          props: {
            action: 'audience_exited',
            audienceName: AUDIENCE_KEY,
            audienceId: AUDIENCE_KEY,
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
