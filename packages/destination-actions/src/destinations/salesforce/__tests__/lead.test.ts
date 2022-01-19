import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.com'
}

describe('Salesforce', () => {
  describe('Lead', () => {
    it('should create a lead record', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

      const event = createTestEvent({
        event: 'Identify',
        traits: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          last_name: 'Squarepants'
        }
      })

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        mapping: {
          operation: 'create',
          email: {
            '@path': '$.traits.email'
          },
          company: {
            '@path': '$.traits.company'
          },
          last_name: {
            '@path': '$.traits.last_name'
          }
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)

      expect(responses[0].request.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer undefined",
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

    it('should update a lead record', async () => {
      const event = createTestEvent({
        event: 'Identify',
        traits: {
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

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        mapping: {
          operation: 'update',
          traits: {
            company: 'Krusty Krab'
          },
          email: {
            '@path': '$.traits.email'
          },
          company: {
            '@path': '$.traits.company'
          },
          last_name: {
            '@path': '$.traits.last_name'
          },
          city: {
            '@path': '$.traits.address.city'
          },
          postal_code: {
            '@path': '$.traits.address.postal_code'
          },
          street: {
            '@path': '$.traits.address.street'
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
              "Bearer undefined",
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
        event: 'Identify',
        traits: {
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

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        mapping: {
          operation: 'upsert',
          traits: {
            company: 'Krusty Krab'
          },
          email: {
            '@path': '$.traits.email'
          },
          company: {
            '@path': '$.traits.company'
          },
          last_name: {
            '@path': '$.traits.last_name'
          },
          city: {
            '@path': '$.traits.address.city'
          },
          postal_code: {
            '@path': '$.traits.address.postal_code'
          },
          street: {
            '@path': '$.traits.address.street'
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
              "Bearer undefined",
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
        event: 'Identify',
        traits: {
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

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
        .get(`/?q=SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 0
        })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

      const responses = await testDestination.testAction('lead', {
        event,
        settings,
        mapping: {
          operation: 'upsert',
          traits: {
            company: 'Krusty Krab'
          },
          email: {
            '@path': '$.traits.email'
          },
          company: {
            '@path': '$.traits.company'
          },
          last_name: {
            '@path': '$.traits.last_name'
          },
          city: {
            '@path': '$.traits.address.city'
          },
          postal_code: {
            '@path': '$.traits.address.postal_code'
          },
          street: {
            '@path': '$.traits.address.street'
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
              "Bearer undefined",
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
