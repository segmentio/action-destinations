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
  describe('Lead', () => {
    it('should create a lead record', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Lead',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          last_name: 'Squarepants'
        }
      })

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          email: {
            '@path': '$.properties.email'
          },
          company: {
            '@path': '$.properties.company'
          },
          last_name: {
            '@path': '$.properties.last_name'
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
      )
    })

    it('should create a lead record with default mappings', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Lead',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            country: 'The Ocean',
            street: 'Pineapple Ln',
            state: 'Water'
          },
          last_name: 'Bob',
          first_name: 'Sponge'
        }
      })

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create'
        },
        useDefaultMappings: true
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
        `"{\\"LastName\\":\\"Bob\\",\\"Company\\":\\"Krusty Krab\\",\\"FirstName\\":\\"Sponge\\",\\"State\\":\\"Water\\",\\"Street\\":\\"Pineapple Ln\\",\\"Country\\":\\"The Ocean\\",\\"PostalCode\\":\\"12345\\",\\"City\\":\\"Bikini Bottom\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
      )
    })

    it('should create a lead record with custom fields', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Lead',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          last_name: 'Squarepants'
        }
      })

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          email: {
            '@path': '$.properties.email'
          },
          company: {
            '@path': '$.properties.company'
          },
          last_name: {
            '@path': '$.properties.last_name'
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab\\",\\"Email\\":\\"sponge@seamail.com\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"}"`
      )
    })

    it('should update a lead record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Update Lead',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab LLC',
          last_name: 'Squarepants',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            street: 'Pineapple St'
          }
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'update',
          traits: {
            company: 'Krusty Krab'
          },
          email: {
            '@path': '$.properties.email'
          },
          company: {
            '@path': '$.properties.company'
          },
          last_name: {
            '@path': '$.properties.last_name'
          },
          city: {
            '@path': '$.properties.address.city'
          },
          postal_code: {
            '@path': '$.properties.address.postal_code'
          },
          street: {
            '@path': '$.properties.address.street'
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab LLC\\",\\"Street\\":\\"Pineapple St\\",\\"PostalCode\\":\\"12345\\",\\"City\\":\\"Bikini Bottom\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
      )
    })

    it('should upsert an existing record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert Lead',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab LLC',
          last_name: 'Squarepants',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            street: 'Pineapple St'
          }
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          traits: {
            company: 'Krusty Krab'
          },
          email: {
            '@path': '$.properties.email'
          },
          company: {
            '@path': '$.properties.company'
          },
          last_name: {
            '@path': '$.properties.last_name'
          },
          city: {
            '@path': '$.properties.address.city'
          },
          postal_code: {
            '@path': '$.properties.address.postal_code'
          },
          street: {
            '@path': '$.properties.address.street'
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab LLC\\",\\"Street\\":\\"Pineapple St\\",\\"PostalCode\\":\\"12345\\",\\"City\\":\\"Bikini Bottom\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
      )
    })

    it('should upsert a nonexistent record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert Lead',
        properties: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab LLC',
          last_name: 'Squarepants',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            street: 'Pineapple St'
          }
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
        Id: 'abc123',
        totalSize: 0
      })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          traits: {
            company: 'Krusty Krab'
          },
          email: {
            '@path': '$.properties.email'
          },
          company: {
            '@path': '$.properties.company'
          },
          last_name: {
            '@path': '$.properties.last_name'
          },
          city: {
            '@path': '$.properties.address.city'
          },
          postal_code: {
            '@path': '$.properties.address.postal_code'
          },
          street: {
            '@path': '$.properties.address.street'
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab LLC\\",\\"Street\\":\\"Pineapple St\\",\\"PostalCode\\":\\"12345\\",\\"City\\":\\"Bikini Bottom\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
      )
    })
  })
})
