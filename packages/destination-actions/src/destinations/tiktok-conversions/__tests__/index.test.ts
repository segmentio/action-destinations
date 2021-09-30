import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2021-09-2T15:21:15.449Z'
// const webEventService = nock('https://ads.tiktok.com/open_api/v1.2')

describe('Tiktok Conversions', () => {
  describe('reportWebEvent', () => {
    it('should send a successful event to reportWebEvent', async () => {
      const settings: Settings = {
        accessToken: '33266b82878009bd3d3998914a865c9ac96367ef',
        appId: 6990028389402804225,
        secretKey: '508507961180419b4d0df0bb3e8fc5ba5b47111b',
        pixel_code: 'C4AUAO1U9OSI64ECBNO0'
      }

      const event = createTestEvent({
        timestamp: timestamp,
        event: 'Checkout Started',
        messageId: 'corey123',
        type: 'track'
      })

      nock('https://ads.tiktok.com/open_api/v1.2/pixel/track').post('/').reply(200, {})
      const responses = await testDestination.testAction('reportWebEvent', {
        event,
        settings,
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })
})
