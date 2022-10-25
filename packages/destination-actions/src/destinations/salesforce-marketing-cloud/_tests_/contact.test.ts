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
  type: 'identify',
  traits: {
    contactKey: 'ericForman15'
  }
})

const requestUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/contacts/v1/contacts`
describe('Salesforce Marketing Cloud', () => {
  describe('Create Contact Action', () => {
    it('Create a Contact', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('contact', {
        event,
        settings,
        mapping: {
          contactKey: { '@path': '$.traits.contactKey' }
        }
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"contactKey\\":\\"ericForman15\\",\\"attributeSets\\":[]}"`
      )
    })
    it('Create a Contact with Default', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('contact', {
        event,
        settings,
        useDefaultMappings: true
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"contactKey\\":\\"eric-15\\",\\"attributeSets\\":[]}"`
      )
    })
    it('Fail to create contact due to missing required field -> contactKey', async () => {
      nock(requestUrl).post('').reply(400, {})
      await expect(
        testDestination.testAction('contact', {
          event,
          settings
        })
      ).rejects.toThrowError(`The root value is missing the required field 'contactKey'.`)
    })
  })
})
