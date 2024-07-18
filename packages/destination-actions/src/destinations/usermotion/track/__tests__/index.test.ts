import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const endpoint = ' https://api.usermotion.com'

describe('Usermotion.track', () => {
  test('should map userId and traits and pass them into UserMotion.track', async () => {
    nock(`${endpoint}`).post(`/v1/track`).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      properties: { clickedButton: true },
      userId: '1453',
      anonymousId: null,
      event: 'Test Event',
      context: {}
    })

    const responses = await testDestination.testAction('track', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key'
      }
    })

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')

    expect(responses[0].status).toBe(200)
    expect(payload).toMatchObject({
      event: 'Test Event',
      userId: '1453',
      context: {},
      properties: { clickedButton: true }
    })
  })

  test('should map userId and traits and pass them into UserMotion.pageview', async () => {
    nock(`${endpoint}`).post(`/v1/track`).reply(200, {})

    const event = createTestEvent({
      type: 'page',
      properties: { clickedButton: true },
      userId: '1453',
      anonymousId: null,
      event: 'Page View',
      context: {}
    })

    const responses = await testDestination.testAction('track', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key'
      }
    })

    const payload = JSON.parse(responses[0].options.body?.toString() ?? '')

    expect(responses[0].status).toBe(200)
    expect(payload).toMatchObject({
      event: 'Page View',
      userId: '1453',
      context: {},
      properties: { clickedButton: true }
    })
  })

  test('should not call track if eventName is not provided', async () => {
    nock(`${endpoint}`).post(`/v1/track`).reply(200, {})
    const event = createTestEvent({
      type: 'track',
      userId: '1453',
      event: ''
    })

    await expect(
      testDestination.testAction('track', {
        event,
        useDefaultMappings: true,
        settings: {
          apiKey: 'test-api-key'
        }
      })
    ).rejects.toThrowError("The root value is missing the required field 'eventName'.")
  })
})
