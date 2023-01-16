import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONValue } from '@segment/actions-core'
import Destination from '../../index'
import { getHeapUserId } from '../../userIdHash'
import { SegmentEvent } from '@segment/actions-core'
import { embededObject, flattenObject } from '../../__tests__/flat.test'

describe('Heap.identifyUser', () => {
  describe('accepts', () => {
    const testDestination = createTestIntegration(Destination)
    const timestamp = '2021-08-17T15:21:15.449Z'
    const HEAP_TEST_APP_ID = '11'
    const userId = 'identity1'
    const anonymousId = 'anon1'
    const event: Partial<SegmentEvent> = createTestEvent({ timestamp, userId, anonymousId })
    const heapUserId = getHeapUserId(anonymousId)
    beforeEach(() => {
      expect(heapUserId).toBe(435837195053672)
      const identifyBody = {
        app_id: HEAP_TEST_APP_ID,
        identity: userId,
        user_id: heapUserId
      }
      nock('https://heapanalytics.com').post('/api/v1/identify', identifyBody).reply(200, {})
    })

    afterEach((done) => {
      const allNockIsCalled = nock.isDone()
      nock.cleanAll()
      if (allNockIsCalled) {
        done()
      } else {
        done.fail(new Error('Not all nock interceptors were used!'))
      }
    })

    it('an embeded object', async () => {
      event.traits = embededObject() as unknown as {
        [k: string]: JSONValue
      }
      const aupBody = {
        app_id: HEAP_TEST_APP_ID,
        identity: userId,
        properties: flattenObject()
      }

      nock('https://heapanalytics.com').post('/api/add_user_properties', aupBody).reply(200, {})

      const responses = await testDestination.testAction('identifyUser', {
        event,
        useDefaultMappings: true,
        settings: {
          appId: HEAP_TEST_APP_ID
        }
      })
      // validate all interceptors were used,
      // and the request parameters, including url and body, were matched.
      expect(responses.length).toBe(2)

      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
      expect(responses[1].status).toBe(200)
      expect(responses[1].data).toMatchObject({})
    })
  })
})
