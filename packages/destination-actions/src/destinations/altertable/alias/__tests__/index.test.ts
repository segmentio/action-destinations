import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Altertable.alias', () => {
  const endpoint = 'https://api.altertable.ai'
  const apiKey = 'test-api-key'
  const environment = 'test-environment'

  beforeEach(() => nock.cleanAll())

  it('should send alias to Altertable', async () => {
    const event = createTestEvent({
      previousId: 'prev-anon-id',
      userId: 'new-user-id',
      timestamp: '2026-01-05T09:35:42.275Z',
      context: {
        device: {
          id: 'device-xyz'
        }
      }
    })

    nock(endpoint).post('/alias').reply(200, {})

    const responses = await testDestination.testAction('alias', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey,
        endpoint,
        environment
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    const payload = JSON.parse(responses[0].options.body as string)
    expect(payload).toEqual({
      distinct_id: 'prev-anon-id',
      device_id: 'device-xyz',
      environment: 'test-environment',
      new_user_id: 'new-user-id',
      timestamp: '2026-01-05T09:35:42.275Z'
    })
  })
})
