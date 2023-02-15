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
  describe('Account', () => {
    it('should create a account record', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Account').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Account',
        properties: {
          name: "John's Test Acccount"
        }
      })

      const responses = await testDestination.testAction('account', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          name: {
            '@path': '$.properties.name'
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

      expect(responses[0].options.body).toMatchInlineSnapshot(`"{\\"Name\\":\\"John's Test Acccount\\"}"`)
    })

    it('should create a account record with default mappings', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Account').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Account',
        properties: {
          name: 'John TA',
          account_number: '123',
          employees: 1000000,
          address: {
            city: 'San Fran',
            postal_code: '94107',
            country: 'United States',
            street: 'Super Legit Street',
            state: 'CA'
          },
          phone: '6786786789',
          description: 'John Test Acccount',
          website: 'https://google.com'
        }
      })

      const responses = await testDestination.testAction('account', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          name: {
            '@path': '$.properties.name'
          },
          account_number: {
            '@path': '$.properties.account_number'
          }
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
        `"{\\"Name\\":\\"John TA\\",\\"AccountNumber\\":\\"123\\",\\"NumberOfEmployees\\":1000000,\\"BillingCity\\":\\"San Fran\\",\\"BillingPostalCode\\":\\"94107\\",\\"BillingCountry\\":\\"United States\\",\\"BillingStreet\\":\\"Super Legit Street\\",\\"BillingState\\":\\"CA\\",\\"Phone\\":\\"6786786789\\",\\"Description\\":\\"John Test Acccount\\",\\"Website\\":\\"https://google.com\\"}"`
      )
    })

    it('should create a account record with custom fields', async () => {
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Account').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Account',
        properties: {
          name: 'John TA'
        }
      })

      const responses = await testDestination.testAction('account', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'create',
          name: {
            '@path': '$.properties.name'
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
        `"{\\"Name\\":\\"John TA\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"}"`
      )
    })

    it('should update a account record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Update Account',
        properties: {
          name: 'John Updated TA',
          phone: '6786786789',
          description: 'John Test Acccount',
          website: 'https://google.com'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Account WHERE name = 'John TA'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Account/123456').reply(201, {})

      const responses = await testDestination.testAction('account', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'update',
          traits: {
            name: 'John TA'
          },
          name: {
            '@path': '$.properties.name'
          }
        },
        useDefaultMappings: true
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
        `"{\\"Name\\":\\"John Updated TA\\",\\"Phone\\":\\"6786786789\\",\\"Description\\":\\"John Test Acccount\\",\\"Website\\":\\"https://google.com\\"}"`
      )
    })

    it('should upsert an existing record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert existing Account',
        properties: {
          name: 'John Updated TA',
          phone: '6786786789',
          description: 'John Test Acccount',
          website: 'https://google.com'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Account WHERE name = 'John TA'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`)
        .get(`/?q=${query}`)
        .reply(201, {
          Id: 'abc123',
          totalSize: 1,
          records: [{ Id: '123456' }]
        })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).patch('/Account/123456').reply(201, {})

      const responses = await testDestination.testAction('account', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          traits: {
            name: 'John TA'
          },
          name: {
            '@path': '$.properties.name'
          }
        },
        useDefaultMappings: true
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
        `"{\\"Name\\":\\"John Updated TA\\",\\"Phone\\":\\"6786786789\\",\\"Description\\":\\"John Test Acccount\\",\\"Website\\":\\"https://google.com\\"}"`
      )
    })

    it('should upsert a nonexistent record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Upsert non existing Account',
        properties: {
          name: 'John Updated TA',
          phone: '6786786789',
          description: 'John Test Acccount',
          website: 'https://google.com'
        }
      })

      const query = encodeURIComponent(`SELECT Id FROM Account WHERE name = 'John TA'`)
      nock(`${settings.instanceUrl}services/data/${API_VERSION}/query`).get(`/?q=${query}`).reply(201, {
        Id: 'abc123',
        totalSize: 0
      })

      nock(`${settings.instanceUrl}services/data/${API_VERSION}/sobjects`).post('/Account').reply(201, {})

      const responses = await testDestination.testAction('account', {
        event,
        settings,
        auth,
        mapping: {
          operation: 'upsert',
          traits: {
            name: 'John TA'
          },
          name: {
            '@path': '$.properties.name'
          }
        },
        useDefaultMappings: true
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
        `"{\\"Name\\":\\"John Updated TA\\",\\"Phone\\":\\"6786786789\\",\\"Description\\":\\"John Test Acccount\\",\\"Website\\":\\"https://google.com\\"}"`
      )
    })
  })
})
