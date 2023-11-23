import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import { baseUrl } from '../../constants'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2023-02-22T15:21:15.449Z'

describe('Trackey.track', () => {
  it('Sends the tracked events data correctly', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'test-user-id',
      event: 'test-event',
      timestamp,
      groupId: 'test-group-id',
      properties: { 'event-prop-1': 'test-value', 'event-prop-2': 'test-value-2' }
    })

    nock(baseUrl)
      .post('')
      .reply(202, {
        status: 'SUCCESS',
        data: {
          message: 'Event tracked'
        }
      })

    const response = await testDestination.testAction('group', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key'
      }
    })

    expect(response[0].status).toBe(202)
    expect(response[0].data).toMatchObject({
      status: 'SUCCESS',
      data: {
        message: 'Event tracked'
      }
    })
    expect(response.length).toBe(1)
  })
})
