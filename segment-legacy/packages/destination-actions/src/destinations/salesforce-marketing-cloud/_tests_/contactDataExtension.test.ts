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
  userId: 'harry-1',
  type: 'identify',
  traits: {
    key: 'dataExtension12',
    keys: {
      contactKey: 'harryStyles1',
      id: 'HS1'
    },
    values: {
      First_Name: 'Harry',
      Last_Name: 'Styles'
    }
  }
})
const requestUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:dataExtension12/rowset`
describe('Salesforce Marketing Cloud', () => {
  describe('Contact Data Extension Action', () => {
    it('Add Contact to Data Extension', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('contactDataExtension', {
        event,
        settings,
        mapping: {
          key: { '@path': '$.traits.key' },
          keys: { '@path': '$.traits.keys' },
          values: { '@path': '$.traits.values' }
        }
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"[{\\"keys\\":{\\"contactKey\\":\\"harryStyles1\\",\\"id\\":\\"HS1\\"},\\"values\\":{\\"First_Name\\":\\"Harry\\",\\"Last_Name\\":\\"Styles\\"}}]"`
      )
    })
    it('Add Contact to Data Extension with default', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('contactDataExtension', {
        event,
        settings,
        useDefaultMappings: true,
        mapping: {
          key: { '@path': '$.traits.key' },
          values: { '@path': '$.traits.values' }
        }
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"[{\\"keys\\":{\\"contactKey\\":\\"harry-1\\"},\\"values\\":{\\"First_Name\\":\\"Harry\\",\\"Last_Name\\":\\"Styles\\"}}]"`
      )
    })
    it('Fail to add contact to data extension due to missing key and id', async () => {
      nock(requestUrl).post('').reply(400, {})
      await expect(
        testDestination.testAction('contactDataExtension', {
          event,
          settings,
          mapping: {
            keys: { '@path': '$.traits.keys' },
            values: { '@path': '$.traits.values' }
          }
        })
      ).rejects.toThrowError(
        `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`
      )
    })
  })
})
