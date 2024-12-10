import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import sfmc from '../index'
import { Settings } from '../generated-types'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(sfmc)
// const timestamp = '2022-05-12T15:21:15.449Z'
const settings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}
const requestUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/1234567890/rowset`
const mapping = {
  id: { '@path': '$.properties.id' },
  keys: { '@path': '$.properties.keys' },
  values: { '@path': '$.properties.values' }
}

describe('Multistatus', () => {
  describe('dataExtension', () => {
    it('should successfully handle a batch of events with complete success response from SFMC API', async () => {
      nock(requestUrl).post('').reply(200, {})

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
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
        }),
        // Valid Event
        createTestEvent({
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
      ]

      const response = await testDestination.executeBatch('dataExtension', {
        events,
        settings,
        mapping
      })

      console.log(response)

      expect(response[0]).toMatchObject({
        status: 200,
        body: {}
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: {}
      })
    })
  })
})
