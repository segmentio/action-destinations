import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.com'
}
const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123'
}

describe('Salesforce', () => {
  describe('Account', () => {
    it('should create a account record', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Account').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Account',
        properties: {
          name: "Logan's Test Acccount"
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

      expect(responses[0].options.body).toMatchInlineSnapshot(`"{\\"Name\\":\\"Logan's Test Acccount\\"}"`)
    })

    it('should create a account record with default mappings', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Account').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Account',
        properties: {
          name: 'Logan TA',
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
          description: 'Logan Test Acccount',
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
        `"{\\"Name\\":\\"Logan TA\\",\\"AccountNumber\\":\\"123\\",\\"NumberOfEmployees\\":1000000,\\"BillingCity\\":\\"San Fran\\",\\"BillingPostalCode\\":\\"94107\\",\\"BillingCountry\\":\\"United States\\",\\"BillingStreet\\":\\"Super Legit Street\\",\\"BillingState\\":\\"CA\\",\\"Phone\\":\\"6786786789\\",\\"Description\\":\\"Logan Test Acccount\\",\\"Website\\":\\"https://google.com\\"}"`
      )
    })

    it('should create a account record with custom fields', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Account').reply(201, {})

      const event = createTestEvent({
        type: 'track',
        event: 'Create Account',
        properties: {
          name: 'Logan TA'
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
        `"{\\"Name\\":\\"Logan TA\\",\\"A\\":\\"1\\",\\"B\\":\\"2\\",\\"C\\":\\"3\\"}"`
      )
    })

    //     it('should update a lead record', async () => {
    //       const event = createTestEvent({
    //         type: 'track',
    //         event: 'Update Lead',
    //         properties: {
    //           email: 'sponge@seamail.com',
    //           company: 'Krusty Krab LLC',
    //           last_name: 'Squarepants',
    //           address: {
    //             city: 'Bikini Bottom',
    //             postal_code: '12345',
    //             street: 'Pineapple St'
    //           }
    //         }
    //       })

    //       nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
    //         .get(`/?q=SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
    //         .reply(201, {
    //           Id: 'abc123',
    //           totalSize: 1,
    //           records: [{ Id: '123456' }]
    //         })

    //       nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

    //       const responses = await testDestination.testAction('lead', {
    //         event,
    //         settings,
    //         auth,
    //         mapping: {
    //           operation: 'update',
    //           traits: {
    //             company: 'Krusty Krab'
    //           },
    //           email: {
    //             '@path': '$.properties.email'
    //           },
    //           company: {
    //             '@path': '$.properties.company'
    //           },
    //           last_name: {
    //             '@path': '$.properties.last_name'
    //           },
    //           city: {
    //             '@path': '$.properties.address.city'
    //           },
    //           postal_code: {
    //             '@path': '$.properties.address.postal_code'
    //           },
    //           street: {
    //             '@path': '$.properties.address.street'
    //           }
    //         }
    //       })

    //       expect(responses.length).toBe(2)
    //       expect(responses[0].status).toBe(201)
    //       expect(responses[1].status).toBe(201)

    //       expect(responses[0].request.headers).toMatchInlineSnapshot(`
    //         Headers {
    //           Symbol(map): Object {
    //             "authorization": Array [
    //               "Bearer abc123",
    //             ],
    //             "user-agent": Array [
    //               "Segment (Actions)",
    //             ],
    //           },
    //         }
    //       `)

    //       expect(responses[1].options.body).toMatchInlineSnapshot(
    //         `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab LLC\\",\\"Street\\":\\"Pineapple St\\",\\"PostalCode\\":\\"12345\\",\\"City\\":\\"Bikini Bottom\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
    //       )
    //     })

    //     it('should upsert an existing record', async () => {
    //       const event = createTestEvent({
    //         type: 'track',
    //         event: 'Upsert Lead',
    //         properties: {
    //           email: 'sponge@seamail.com',
    //           company: 'Krusty Krab LLC',
    //           last_name: 'Squarepants',
    //           address: {
    //             city: 'Bikini Bottom',
    //             postal_code: '12345',
    //             street: 'Pineapple St'
    //           }
    //         }
    //       })

    //       nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
    //         .get(`/?q=SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
    //         .reply(201, {
    //           Id: 'abc123',
    //           totalSize: 1,
    //           records: [{ Id: '123456' }]
    //         })

    //       nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).patch('/Lead/123456').reply(201, {})

    //       const responses = await testDestination.testAction('lead', {
    //         event,
    //         settings,
    //         auth,
    //         mapping: {
    //           operation: 'upsert',
    //           traits: {
    //             company: 'Krusty Krab'
    //           },
    //           email: {
    //             '@path': '$.properties.email'
    //           },
    //           company: {
    //             '@path': '$.properties.company'
    //           },
    //           last_name: {
    //             '@path': '$.properties.last_name'
    //           },
    //           city: {
    //             '@path': '$.properties.address.city'
    //           },
    //           postal_code: {
    //             '@path': '$.properties.address.postal_code'
    //           },
    //           street: {
    //             '@path': '$.properties.address.street'
    //           }
    //         }
    //       })

    //       expect(responses.length).toBe(2)
    //       expect(responses[0].status).toBe(201)
    //       expect(responses[1].status).toBe(201)

    //       expect(responses[0].request.headers).toMatchInlineSnapshot(`
    //         Headers {
    //           Symbol(map): Object {
    //             "authorization": Array [
    //               "Bearer abc123",
    //             ],
    //             "user-agent": Array [
    //               "Segment (Actions)",
    //             ],
    //           },
    //         }
    //       `)

    //       expect(responses[1].options.body).toMatchInlineSnapshot(
    //         `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab LLC\\",\\"Street\\":\\"Pineapple St\\",\\"PostalCode\\":\\"12345\\",\\"City\\":\\"Bikini Bottom\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
    //       )
    //     })

    //     it('should upsert a nonexistent record', async () => {
    //       const event = createTestEvent({
    //         type: 'track',
    //         event: 'Upsert Lead',
    //         properties: {
    //           email: 'sponge@seamail.com',
    //           company: 'Krusty Krab LLC',
    //           last_name: 'Squarepants',
    //           address: {
    //             city: 'Bikini Bottom',
    //             postal_code: '12345',
    //             street: 'Pineapple St'
    //           }
    //         }
    //       })

    //       nock(`${settings.instanceUrl}/services/data/${API_VERSION}/query`)
    //         .get(`/?q=SELECT Id FROM Lead WHERE company = 'Krusty Krab'`)
    //         .reply(201, {
    //           Id: 'abc123',
    //           totalSize: 0
    //         })

    //       nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/Lead').reply(201, {})

    //       const responses = await testDestination.testAction('lead', {
    //         event,
    //         settings,
    //         auth,
    //         mapping: {
    //           operation: 'upsert',
    //           traits: {
    //             company: 'Krusty Krab'
    //           },
    //           email: {
    //             '@path': '$.properties.email'
    //           },
    //           company: {
    //             '@path': '$.properties.company'
    //           },
    //           last_name: {
    //             '@path': '$.properties.last_name'
    //           },
    //           city: {
    //             '@path': '$.properties.address.city'
    //           },
    //           postal_code: {
    //             '@path': '$.properties.address.postal_code'
    //           },
    //           street: {
    //             '@path': '$.properties.address.street'
    //           }
    //         }
    //       })

    //       expect(responses.length).toBe(2)
    //       expect(responses[0].status).toBe(201)
    //       expect(responses[1].status).toBe(201)

    //       expect(responses[0].request.headers).toMatchInlineSnapshot(`
    //         Headers {
    //           Symbol(map): Object {
    //             "authorization": Array [
    //               "Bearer abc123",
    //             ],
    //             "user-agent": Array [
    //               "Segment (Actions)",
    //             ],
    //           },
    //         }
    //       `)

    //       expect(responses[1].options.body).toMatchInlineSnapshot(
    //         `"{\\"LastName\\":\\"Squarepants\\",\\"Company\\":\\"Krusty Krab LLC\\",\\"Street\\":\\"Pineapple St\\",\\"PostalCode\\":\\"12345\\",\\"City\\":\\"Bikini Bottom\\",\\"Email\\":\\"sponge@seamail.com\\"}"`
    //       )
    //     })
  })
})
