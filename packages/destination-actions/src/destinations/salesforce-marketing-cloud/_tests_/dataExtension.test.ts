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
  type: 'track',
  userId: 'harry-1',
  properties: {
    id: '1234567890',
    keys: {
      id: 'HS1'
    },
    values: {
      name: 'Harry Styles'
    }
  }
})

const requestUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/1234567890/rowset`
describe('Salesforce Marketing Cloud', () => {
  describe('Data Extension Action', () => {
    it('Add Event to Data Extension', async () => {
      nock(requestUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('dataExtension', {
        event,
        settings,
        mapping: {
          id: { '@path': '$.properties.id' },
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' }
        }
      })
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"[{\\"keys\\":{\\"id\\":\\"HS1\\"},\\"values\\":{\\"name\\":\\"Harry Styles\\"}}]"`
      )
    })
    it('Fail to add event to data extension due to missing key and id', async () => {
      nock(requestUrl).post('').reply(400, {})
      await expect(
        testDestination.testAction('dataExtension', {
          event,
          settings,
          mapping: {
            keys: { '@path': '$.properties.keys' },
            values: { '@path': '$.properties.values' }
          }
        })
      ).rejects.toThrowError(
        `In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.`
      )
    })

    it('should prioritize using the data extension ID created or selected from the hook', async () => {
      const expectedUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/hook_output123/rowset`

      nock(expectedUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('dataExtension', {
        event,
        settings,
        mapping: {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          onMappingSave: {
            inputs: {},
            outputs: {
              id: 'hook_output123'
            }
          }
        }
      })

      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"[{\\"keys\\":{\\"id\\":\\"HS1\\"},\\"values\\":{\\"name\\":\\"Harry Styles\\"}}]"`
      )
    })

    it('should fallback to using an existing deprecated data extension ID if no hook ID exists', async () => {
      const expectedUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/deprecated_123/rowset`

      nock(expectedUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('dataExtension', {
        event,
        settings,
        mapping: {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          id: 'deprecated_123'
        }
      })

      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"[{\\"keys\\":{\\"id\\":\\"HS1\\"},\\"values\\":{\\"name\\":\\"Harry Styles\\"}}]"`
      )
    })

    it('should fallback to using an existing deprecated data extension key if no hook ID exists and no deprecated ID exists', async () => {
      const expectedUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/key:deprecated_123/rowset`

      nock(expectedUrl).post('').reply(200, {})
      const responses = await testDestination.testAction('dataExtension', {
        event,
        settings,
        mapping: {
          keys: { '@path': '$.properties.keys' },
          values: { '@path': '$.properties.values' },
          key: 'deprecated_123'
        }
      })

      expect(responses[0].status).toBe(200)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"[{\\"keys\\":{\\"id\\":\\"HS1\\"},\\"values\\":{\\"name\\":\\"Harry Styles\\"}}]"`
      )
    })
  })
})
