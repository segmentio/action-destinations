import nock from 'nock'
import { createTestEvent, createTestIntegration, JSONValue } from '@segment/actions-core'
import Destination from '../../index'
import { SegmentEvent } from '@segment/actions-core'
import { embededObject, getFlatObject } from '../../__tests__/flat.test'

describe('Heap.identifyUser', () => {
  describe('accepts', () => {
    const testDestination = createTestIntegration(Destination)
    const timestamp = '2021-08-17T15:21:15.449Z'
    const HEAP_TEST_APP_ID = '11'
    const userId = 'identity1'
    const anonymous_id = 'anon1'
    const heapURL = 'https://heapanalytics.com'
    const addUserPropertiesURI = '/api/add_user_properties'
    const addUserPropertiesBody = {
      app_id: HEAP_TEST_APP_ID,
      identity: userId,
      properties: {}
    }

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
      const event: Partial<SegmentEvent> = createTestEvent({ timestamp, userId, anonymousId: anonymous_id })
      event.traits = embededObject() as unknown as {
        [k: string]: JSONValue
      }
      addUserPropertiesBody.properties = {
        ...getFlatObject(),
        anonymous_id
      }

      nock(heapURL).post(addUserPropertiesURI, addUserPropertiesBody).reply(200, {})

      const responses = await testDestination.testAction('identifyUser', {
        event,
        useDefaultMappings: true,
        settings: {
          appId: HEAP_TEST_APP_ID
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].data).toMatchObject({})
    })

    it('should fail if identity is "0"', async () => {
      const event: Partial<SegmentEvent> = createTestEvent({ timestamp, userId: '0', anonymousId: anonymous_id })

      const testIdentitfyAction = () =>
        testDestination.testAction('identifyUser', {
          event,
          useDefaultMappings: true,
          settings: {
            appId: HEAP_TEST_APP_ID
          }
        })

      await expect(testIdentitfyAction()).rejects.toThrow(
        'Missing identity, cannot add user properties without identity'
      )
    })
  })
})
