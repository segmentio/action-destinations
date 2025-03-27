import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const endpoint = ' https://api.usermotion.com'

describe('Usermotion.group', () => {
  test('should map groupId and traits and pass them into UserMotion.group', async () => {
    nock(`${endpoint}`).post(`/v1/group`).reply(200, {})

    const event = createTestEvent({
      groupId: '1453',
      anonymousId: 'anon1234',
      userId: '1234',
      traits: { website: 'usermotion.com' }
    })

    const responses = await testDestination.testAction('group', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key'
      }
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(
      JSON.stringify({ id: '1453', userId: '1234', anonymousId: 'anon1234', properties: { website: 'usermotion.com' } })
    )
  })

  test('should not call group if groupId is not provided', async () => {
    nock(`${endpoint}`).post(`/v1/group`).reply(200, {})

    const event = createTestEvent({
      type: 'group',
      groupId: null,
      traits: {
        website: 'usermotion.com'
      }
    })

    await expect(
      testDestination.testAction('group', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: 'test-api-key'
        }
      })
    ).rejects.toThrowError("The root value is missing the required field 'groupId'.")
  })
})
