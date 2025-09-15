import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2023-02-22T15:21:15.449Z'

describe('Courier.post', () => {
  it('Posts an event succesfully to US', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'test-event',
      userId: 'test-user-id',
      anonymousId: 'test-anonymous-id',
      properties: { 'test-property': 'test-value', 'test-property-2': 'test-value-2' }
    })

    nock('https://api.courier.com').post('/inbound/segment').reply(202, {
      messageId: 'message-1'
    })

    const response = await testDestination.testAction('postToCourier', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        region: 'US'
      }
    })

    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({
      messageId: 'message-1'
    })
    expect(response.length).toBe(1)
  })

  it('Posts an event succesfully to EU', async () => {
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'test-event',
      userId: 'test-user-id',
      anonymousId: 'test-anonymous-id',
      properties: { 'test-property': 'test-value', 'test-property-2': 'test-value-2' }
    })

    nock('https://api.eu.courier.com').post('/inbound/segment').reply(202, {
      messageId: 'message-1'
    })

    const response = await testDestination.testAction('postToCourier', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        region: 'EU'
      }
    })

    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({
      messageId: 'message-1'
    })
    expect(response.length).toBe(1)
  })
})
