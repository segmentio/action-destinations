import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2023-02-22T15:21:15.449Z'

describe('Courier.audienceToList', () => {
  // nock.recorder.rec({
  //   output_objects: true,  // Capture the requests in an object format
  //   logging: function (content) {
  //     console.log(content);  // Log the captured requests
  //   }
  // });

  it('Adds user to the listId', async () => {
    const COMP_KEY = `test-computation-key`
    const COMP_ID = `test-computation-id`

    const userId = 'test-user-id'
    const listId = `${COMP_KEY}-${COMP_ID}`

    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'test-event',
      userId: userId,
      anonymousId: 'test-anonymous-id',
      properties: { 'test-property': 'test-value', 'test-property-2': 'test-value-2', [COMP_KEY]: true },
      context: {
        personas: {
          computation_key: COMP_KEY,
          computation_id: COMP_ID,
          computation_class: 'audience'
        }
      }
    })

    //    /lists/test-computation-key-test-computation-id/subscriptions/test-user-id
    nock('https://api.courier.com').put(`/lists/${listId}/subscriptions/${userId}`).reply(204)

    const response = await testDestination.testAction('audienceToList', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        region: 'US'
      }
    })

    expect(response[0].status).toBe(204)
    expect(response.length).toBe(1)
  })
  it('Removes user from the listId', async () => {
    const COMP_KEY = `test-computation-key`
    const COMP_ID = `test-computation-id`

    const listId = `${COMP_KEY}-${COMP_ID}`

    const userId = 'test-user-id'
    const event = createTestEvent({
      timestamp,
      type: 'track',
      event: 'test-event',
      userId: userId,
      anonymousId: 'test-anonymous-id',
      properties: { 'test-property': 'test-value', 'test-property-2': 'test-value-2', [COMP_KEY]: false },
      context: {
        personas: {
          computation_key: COMP_KEY,
          computation_id: COMP_ID,
          computation_class: 'audience'
        }
      }
    })

    nock('https://api.courier.com').delete(`/lists/${listId}/subscriptions/${userId}`).reply(204)

    const response = await testDestination.testAction('audienceToList', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: 'test-api-key',
        region: 'US'
      }
    })

    expect(response[0].status).toBe(204)
    expect(response.length).toBe(1)
  })
})
