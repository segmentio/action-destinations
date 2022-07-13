import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)
const timestamp = '2021-08-17T15:21:15.449Z'
const HEAP_TEST_APP_ID = '11'

describe('Heap.identifyUser', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({ timestamp, traits: { abc: '123' }, userId: 'identity1', anonymousId: 'anon1' })

    nock('https://heapanalytics.com').post('/api/v1/identify').reply(200, {})
    nock('https://heapanalytics.com').post('/api/add_user_properties').reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        appId: HEAP_TEST_APP_ID
      }
    })
    expect(responses.length).toBe(2)

    expect(responses[0].status).toBe(200)
    expect(responses[0].data).toMatchObject({})
    expect(JSON.parse(responses[0].options.body!.toString())).toMatchObject({
      app_id: HEAP_TEST_APP_ID,
      user_id: 435837195053672,
      identity: 'identity1'
    })

    expect(responses[1].status).toBe(200)
    expect(responses[1].data).toMatchObject({})
    expect(JSON.parse(responses[1].options.body!.toString())).toMatchObject({
      app_id: HEAP_TEST_APP_ID,
      identity: 'identity1',
      properties: { abc: '123' }
    })
  })
})
