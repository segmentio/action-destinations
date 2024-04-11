import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const auth = {
  url: 'https://api.xtremepush.com',
  apiKey: 'TestingAPIKey'
}

describe('Xtremepush Actions Destination', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://api.xtremepush.com').post('/api/integration/segment/handle').reply(200, {})

      const event = createTestEvent()

      const responses = await testDestination.testAction('identify', {
        event: event,
        useDefaultMappings: true,
        settings: {
          ...auth
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Basic VGVzdGluZ0FQSUtleTo=",
            ],
            "content-type": Array [
              "application/json",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)
    })
  })

  describe('testDelete', () => {
    it('should handle delete event', async () => {
      nock('https://api.xtremepush.com').post('/api/integration/segment/delete').reply(200, {})

      expect(testDestination.onDelete).toBeDefined()
      if (testDestination.onDelete) {
        const event = createTestEvent({
          type: 'delete'
        })

        await expect(testDestination.onDelete(event, auth)).resolves.not.toThrowError()
      }
    })
  })
})
