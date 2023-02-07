import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION } from '../sf-operations'
import { DynamicFieldResponse } from '@segment/actions-core'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://test.salesforce.com'
}
const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123'
}

describe('Salesforce', () => {
  describe('Custom Object Tests', () => {
    it('should create a custom object record', async () => {
      const event = createTestEvent({
        type: 'track',
        event: 'Create Custom Object',
        properties: {
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
          customObjectName: 'TestCustom__c',
          customFields: {
            '@path': '$.properties'
          }
        },
        auth
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
        `"{\\"email\\":\\"sponge@seamail.com\\",\\"company\\":\\"Krusty Krab\\",\\"last_name\\":\\"Squarepants\\"}"`
      )
    })

    it('should dynamically fetch customObjectName', async () => {
      nock(`${settings.instanceUrl}/services/data/${API_VERSION}`)
        .get('/sobjects')
        .reply(200, {
          sobjects: [
            {
              label: 'Accounts',
              name: 'Account',
              createable: true,
              queryable: true
            },
            {
              label: 'Contacts',
              name: 'Contact',
              createable: true,
              queryable: true
            },
            {
              label: 'Test Custom Object',
              name: 'TestCustom__c',
              createable: true,
              queryable: true
            },
            {
              label: 'Hidden Object',
              name: 'HiddenObject__c',
              createable: false,
              queryable: false
            }
          ]
        })

      const payload = {}
      const responses = (await testDestination.testDynamicField('customObject', 'customObjectName', {
        payload,
        settings,
        auth
      })) as DynamicFieldResponse

      expect(responses.choices.length).toBe(3)
      expect(responses.choices).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Accounts',
            value: 'Account'
          }),
          expect.objectContaining({
            label: 'Contacts',
            value: 'Contact'
          }),
          expect.objectContaining({
            label: 'Test Custom Object',
            value: 'TestCustom__c'
          })
        ])
      )
    })
  })
})
