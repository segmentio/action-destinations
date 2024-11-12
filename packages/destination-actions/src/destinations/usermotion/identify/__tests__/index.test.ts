import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const endpoint = ' https://api.usermotion.com'

describe('Usermotion.identify', () => {
  test('should map userId and traits and pass them into UserMotion.identify', async () => {
    nock(`${endpoint}`).post(`/v1/identify`).reply(200, {})

    const event = createTestEvent({
      userId: '1453',
      traits: { email: 'amirali@usermotion.com' },
      anonymousId: 'test-anonymous-id'
    })

    const responses = await testDestination.testAction('identify', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key'
      }
    })

    expect(responses[0].status).toBe(200)
    expect(responses[0].options.body).toBe(
      JSON.stringify({ id: '1453', anonymousId: 'test-anonymous-id', properties: { email: 'amirali@usermotion.com' } })
    )
  })

  test('should not call identify if userId is not provided', async () => {
    nock(`${endpoint}`).post(`/v1/identify`).reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: null,
      traits: {
        email: 'amirali@usermotion.com'
      }
    })

    await expect(
      testDestination.testAction('identify', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: 'test-api-key'
        }
      })
    ).rejects.toThrowError("The root value is missing the required field 'userId'.")
  })

  test('should not call identify if email is not provided', async () => {
    nock(`${endpoint}`).post(`/v1/identify`).reply(200, {})
    const event = createTestEvent({
      type: 'identify',
      userId: '1453',
      traits: {}
    })

    await expect(
      testDestination.testAction('identify', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: 'test-api-key'
        }
      })
    ).rejects.toThrowError("The root value is missing the required field 'email'.")
  })
})
