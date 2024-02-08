import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'

const testDestination = createTestIntegration(Definition)
const timestamp = '2022-05-12T15:21:15.449Z'
const settings: Settings = {
  snap_app_id: 'test123',
  pixel_id: 'test123',
  app_id: 'test123'
}
const accessToken = 'test123'
const refreshToken = 'test123'

const testEvent = createTestEvent({
  timestamp: timestamp,
  messageId: 'test-message-rv4t40s898k',
  event: 'PURCHASE',
  type: 'track',
  properties: {
    email: '   Test123@gmail.com    ',
    phone: '+44 844 412 4653',
    event_tag: 'back-to-school',
    number_items: 10,
    revenue: '15',
    currency: 'USD',
    level: 3
  }
})

const features = {
  ['actions-snap-api-migration-test-capiv3']: false,
  ['actions-snap-api-migration-use-capiv3']: true
}

export const capiV3tests = () =>
  describe('CAPIv3 Implementation', () => {
    it('should handle a basic event', async () => {
      nock(/.*/).post(/.*/).reply(200)

      const event = createTestEvent(testEvent)

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        features,
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      const body = JSON.parse(responses[0].options.body as string)

      const { data } = body
      expect(data.length).toBe(1)

      const { integration, event_name, event_source_url, event_time, user_data, custom_data, action_source, app_data } =
        data[0]
      const { client_ip_address, client_user_agent, em, ph } = user_data
      const { currency, value } = custom_data

      expect(integration).toBe('segment')
      expect(event_name).toBe('PURCHASE')
      expect(event_source_url).toBe('https://segment.com/academy/')
      expect(event_time).toBe(1652368875449)
      expect(client_ip_address).toBe('8.8.8.8')
      expect(client_user_agent).toBe(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1'
      )
      expect(em[0]).toBe('cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9')
      expect(ph[0]).toBe('dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383')
      expect(currency).toBe('USD')
      expect(value).toBe(15)
      expect(action_source).toBe('website')
      expect(app_data).toBeUndefined()
    })
  })
