import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2022-05-12T15:21:15.449Z'
const settings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}

const event = createTestEvent({
  timestamp: timestamp,
  userId: 'eric-15',
  type: 'track',
  properties: {
    contactKey: 'ericForman15',
    eventDefinitionKey: '123',
    eventData: {
      Email: 'eric.forman@test.com',
      First_Name: 'Eric',
      Last_Name: 'Forman'
    }
  }
})

const requestUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/interaction/v1/events`
describe('Salesforce Marketing Cloud', () => {
  describe('Send API Event Action', () => {
    it('Send API Event', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('apiEvent', {
        event,
        settings,
        mapping: {
          contactKey: { '@path': '$.properties.contactKey' },
          eventDefinitionKey: { '@path': '$.properties.eventDefinitionKey' },
          data: { '@path': '$.properties.eventData' }
        }
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"contactKey\\":\\"ericForman15\\",\\"eventDefinitionKey\\":\\"123\\",\\"data\\":{\\"Email\\":\\"eric.forman@test.com\\",\\"First_Name\\":\\"Eric\\",\\"Last_Name\\":\\"Forman\\"}}"`
      )
    })
    it('Send API Event with Default', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('apiEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          eventDefinitionKey: { '@path': '$.properties.eventDefinitionKey' },
          data: { '@path': '$.properties.eventData' }
        }
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"eventDefinitionKey\\":\\"123\\",\\"contactKey\\":\\"eric-15\\",\\"data\\":{\\"Email\\":\\"eric.forman@test.com\\",\\"First_Name\\":\\"Eric\\",\\"Last_Name\\":\\"Forman\\"}}"`
      )
    })
    it('Send API Event without Data', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('apiEvent', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          eventDefinitionKey: { '@path': '$.properties.eventDefinitionKey' }
        }
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"eventDefinitionKey\\":\\"123\\",\\"contactKey\\":\\"eric-15\\"}"`
      )
    })
    it('Fail to send api event due to missing required fields -> contactKey & eventDefinitionKey', async () => {
      nock(requestUrl).post('').reply(400, {})
      await expect(
        testDestination.testAction('apiEvent', {
          event,
          settings
        })
      ).rejects.toThrowError(
        `The root value is missing the required field 'eventDefinitionKey'. The root value is missing the required field 'contactKey'.`
      )
    })
  })
})
