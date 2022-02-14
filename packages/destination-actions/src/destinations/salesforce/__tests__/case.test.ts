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

    it('should update a case record', async () => {
      const event = createTestEvent({
        event: 'Identify',
        traits: {
          description: 'Test two'
        }
      })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Case WHERE description = 'Test one'`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).patch('/Case/123456').reply(201, {})

      const responses = await testDestination.testAction('cases', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'update',
          traits: {
            description: 'Test one'
          },
          description: {
            '@path': '$.traits.description'
          }
        }
      })

      expect(responses.length).toBe(2)
      expect(responses[0].status).toBe(201)
      expect(responses[1].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer abc123",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[1].options.body).toMatchInlineSnapshot(`"{\\"Description\\":\\"Test two\\"}"`)
    })
  })
})
