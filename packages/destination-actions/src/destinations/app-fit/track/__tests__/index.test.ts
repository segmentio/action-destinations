import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import AppFitConfig from '../../config'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('AppFit.track', () => {
  it('should create an event', async () => {
    const timestamp = new Date().toISOString()
    const event = createTestEvent({
      name: 'Segment Test Event Name',
      messageId: '12345',
      userId: 'userId1',
      timestamp,
      context: {
        ip: '8.8.8.8',
        app: { version: '1.0.0' },
        device: { id: 'device1234', type: 'ios', model: 'iPhone7,2', manufacturer: 'Apple' },
        os: { name: 'iPhone OS', version: '10.1' }
      },
      properties: { foo: 'bar' }
    })

    nock(AppFitConfig.apiUrl).post(`/metric-events`).reply(200, {})

    const responses = await testDestination.testAction('track', {
      event,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(responses[0].options.body).toBe(
      `{"eventSource":"segment","occurredAt":"${timestamp}","payload":{"eventId":"12345","userId":"userId1","anonymousId":"anonId1234","name":"Test Event","properties":{"foo":"bar"},"deviceId":"device1234","deviceType":"ios","deviceManufacturer":"Apple","deviceModel":"iPhone7,2","osName":"iPhone OS","osVersion":"10.1","appVersion":"1.0.0","ipAddress":"8.8.8.8"}}`
    )
  })
})
