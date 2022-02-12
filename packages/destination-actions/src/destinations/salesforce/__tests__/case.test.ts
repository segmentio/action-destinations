import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.com'
}
const auth = {
  refreshToken: 'xyz123',
  accessToken: 'abc123'
}

describe('Salesforce', () => {
  describe('Case', () => {
    it('should create a case record', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Case').reply(201, {})

      const event = createTestEvent({
        event: 'Identify',
        traits: {
          description: 'This is test description'
        }
      })

      const responses = await testDestination.testAction('cases', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          description: {
            '@path': '$.traits.description'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer abc123",
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

      expect(responses[0].options.body).toMatchInlineSnapshot(`"{\\"Description\\":\\"This is test description\\"}"`)
    })

    it('should create a case record with custom fields', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Case').reply(201, {})

      const event = createTestEvent({
        event: 'Identify',
        traits: {
          description: 'This is test description'
        }
      })

      const responses = await testDestination.testAction('cases', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          description: {
            '@path': '$.traits.description'
          },
          customFields: {
            A: '1',
            B: '2',
            C: '3'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer abc123",
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

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"Description\\":\\"This is test description\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"}"`
      )
    })
  })
})
