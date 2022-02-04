import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.com'
}

describe('Salesforce', () => {
  describe('Custom Object Tests', () => {
    it('should create a custom object record', async () => {
      const event = createTestEvent({
        event: 'Identify',
        traits: {
          email: 'sponge@seamail.com',
          company: 'Krusty Krab',
          last_name: 'Squarepants'
        }
      })

      nock(`${settings.instanceUrl}/services/data/${API_VERSION}/sobjects`).post('/TestCustom__c').reply(201, {})

      const responses = await testDestination.testAction('customObject', {
        event,
        settings,
        mapping: {
          operation: 'create',
          customObjectName: 'TestCustom',
          customFields: {
            '@path': '$.traits'
          }
        }
      })
      console.log('responses', responses)
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
        `"{\\"email\\":\\"sponge@seamail.com\\",\\"company\\":\\"Krusty Krab\\",\\"last_name\\":\\"Squarepants\\"}"`
      )
    })
  })
})
