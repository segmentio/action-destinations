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
  describe('Contact', () => {
    it('should create a contact record', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Contact').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Contact',
        properties: {
          email: 'sponge@seamail.com',
          last_name: 'Squarepants'
        }
      })

      const responses = await testDestination.testAction('contact', {
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
      )
    })

    it('should create a contact record with default mappings', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Contact').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Contact',
        properties: {
          email: 'sponge@seamail.com',
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

      const responses = await testDestination.testAction('contact', {
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
        `"{\\"LastName\\":\\"Bob\\",\\"FirstName\\":\\"Sponge\\",\\"Email\\":\\"sponge@seamail.com\\",\\"MailingState\\":\\"Water\\",\\"MailingStreet\\":\\"Pineapple Ln\\",\\"MailingCountry\\":\\"The Ocean\\",\\"MailingPostalCode\\":\\"12345\\",\\"MailingCity\\":\\"Bikini Bottom\\"}"`
      )
    })

    it('should create a contact record with custom fields', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Contact').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Contact',
        properties: {
          email: 'sponge@seamail.com',
          last_name: 'Squarepants'
        }
      })

      const responses = await testDestination.testAction('contact', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          email: {
            '@path': '$.properties.email'
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Email\\":\\"sponge@seamail.com\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"}"`
      )
    })

    it('should update a contact record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Update Contact',
        properties: {
          last_name: 'Squarepants',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            street: 'Pineapple St'
          }
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Contact WHERE email = 'sponge@seamail.com'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Contact/123456').reply(201, {})

      const responses = await testDestination.testAction('contact', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'update',
          traits: {
            email: 'sponge@seamail.com'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.properties.last_name'
          },
          mailing_city: {
            '@path': '$.properties.address.city'
          },
          mailing_postal_code: {
            '@path': '$.properties.address.postal_code'
          },
          mailing_street: {
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"MailingStreet\\":\\"Pineapple St\\",\\"MailingPostalCode\\":\\"12345\\",\\"MailingCity\\":\\"Bikini Bottom\\"}"`
      )
    })

    it('should upsert an existing contact record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert Contact',
        properties: {
          email: 'sponge@seamail.com',
          last_name: 'Squarepants',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            street: 'Pineapple St'
          }
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Contact WHERE email = 'spongebob@gmail.com'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Contact/123456').reply(201, {})

      const responses = await testDestination.testAction('contact', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          traits: {
            email: 'spongebob@gmail.com'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.properties.last_name'
          },
          mailing_city: {
            '@path': '$.properties.address.city'
          },
          mailing_postal_code: {
            '@path': '$.properties.address.postal_code'
          },
          mailing_street: {
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Email\\":\\"sponge@seamail.com\\",\\"MailingStreet\\":\\"Pineapple St\\",\\"MailingPostalCode\\":\\"12345\\",\\"MailingCity\\":\\"Bikini Bottom\\"}"`
      )
    })

    it('should upsert a nonexistent record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert Contact',
        properties: {
          email: 'sponge@seamail.com',
          last_name: 'Squarepants',
          address: {
            city: 'Bikini Bottom',
            postal_code: '12345',
            street: 'Pineapple St'
          }
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Contact WHERE email = 'plankton@gmail.com'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
        Id: 'abc123',
        totalSize: 0
      })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Contact').reply(201, {})

      const responses = await testDestination.testAction('contact', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          traits: {
            email: 'plankton@gmail.com'
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
          mailing_city: {
            '@path': '$.properties.address.city'
          },
          mailing_postal_code: {
            '@path': '$.properties.address.postal_code'
          },
          mailing_street: {
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
        `"{\\"LastName\\":\\"Squarepants\\",\\"Email\\":\\"sponge@seamail.com\\",\\"MailingStreet\\":\\"Pineapple St\\",\\"MailingPostalCode\\":\\"12345\\",\\"MailingCity\\":\\"Bikini Bottom\\"}"`
      )
    })
  })
})
