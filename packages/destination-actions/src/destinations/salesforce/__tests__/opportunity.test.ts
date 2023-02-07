import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.salesforce.com/'
}
const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123'
}

describe('Salesforce', () => {
  describe('Opportunity', () => {
    it('should create a opportunity record', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Opportunity').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name',
          stage_name: 'Opportunity stage name'
        }
      })

      const responses = await testDestination.testAction('opportunity', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
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
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })

    it('should create a opportunity record with custom fields', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Opportunity').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Opportunity w/ custom fields',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const responses = await testDestination.testAction('opportunity', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
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
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name\\",\\"StageName\\":\\"Opportunity stage name\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"}"`
      )
    })

    it('should update a opportunity record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Update Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name updated',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Opportunity WHERE name = 'Opportunity Test Name OG'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Opportunity/123456').reply(201, {})

      const responses = await testDestination.testAction('opportunity', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'update',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          },
          traits: {
            name: 'Opportunity Test Name OG'
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

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name updated\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })

    it('should upsert an existing opportunity record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert existing Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name updated',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Opportunity WHERE name = 'Opportunity Test Name OG'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Opportunity/123456').reply(201, {})

      const responses = await testDestination.testAction('opportunity', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          },
          traits: {
            name: 'Opportunity Test Name OG'
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

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name updated\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })

    it('should upsert a nonexistent opportunity record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert non-existent Opportunity',
        properties: {
          close_date: '2022-02-18T22:26:24.997Z',
          name: 'Opportunity Test Name updated',
          stage_name: 'Opportunity stage name',
          description: 'This is a test opportunity description'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Opportunity WHERE name = 'Opportunity Test Name OG'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
        Id: 'abc123',
        totalSize: 0
      })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Opportunity').reply(201, {})

      const responses = await testDestination.testAction('opportunity', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          close_date: {
            '@path': '$.properties.close_date'
          },
          name: {
            '@path': '$.properties.name'
          },
          stage_name: {
            '@path': '$.properties.stage_name'
          },
          traits: {
            name: 'Opportunity Test Name OG'
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

      expect(responses[1].options.body).toMatchInlineSnapshot(
        `"{\\"CloseDate\\":\\"2022-02-18T22:26:24.997Z\\",\\"Name\\":\\"Opportunity Test Name updated\\",\\"StageName\\":\\"Opportunity stage name\\"}"`
      )
    })
  })
})
