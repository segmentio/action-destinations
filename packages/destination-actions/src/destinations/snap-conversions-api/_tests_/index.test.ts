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
    email: 'test123@gmail.com',
    phone: '+44 844 412 4653',
    event_tag: 'back-to-school',
    number_items: 10,
    price: '15',
    currency: 'USD',
    level: 3
  }
})

const conversionEventUrl = 'https://tr.snapchat.com/v2/conversion'

describe('Snap Conversions API ', () => {
  describe('ReportConversionEvent', () => {
    it('should handle a basic event', async () => {
      nock(conversionEventUrl).post('').reply(200, {})

      const event = createTestEvent(testEvent)

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        mapping: {
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"event_type\\":\\"PURCHASE\\",\\"event_conversion_type\\":\\"WEB\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"pixel_id\\":\\"test123\\"}"`
      )
    })

    it('should fail web event without pixel_id', async () => {
      nock(conversionEventUrl).post('').reply(400, {})

      const event = createTestEvent(testEvent)

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: {
            app_id: 'test123'
          },
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'WEB'
          }
        })
      ).rejects.toThrowError('If event conversion type is "WEB" then Pixel ID must be defined')
    })

    it('should fail web event without snap_app_id', async () => {
      nock(conversionEventUrl).post('').reply(400, {})

      const event = createTestEvent(testEvent)

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings: {
            pixel_id: 'test123',
            app_id: 'test123'
          },
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'MOBILE_APP'
          }
        })
      ).rejects.toThrowError('If event conversion type is "MOBILE_APP" then Snap App ID and App ID must be defined')
    })

    it('should handle an offline event conversion type', async () => {
      nock(conversionEventUrl).post('').reply(200, {})

      const event = createTestEvent(testEvent)

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        mapping: {
          event_type: 'SAVE',
          event_conversion_type: 'OFFLINE'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"event_type\\":\\"SAVE\\",\\"event_conversion_type\\":\\"OFFLINE\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"pixel_id\\":\\"test123\\"}"`
      )
    })

    it('should handle a mobile app event conversion type', async () => {
      nock(conversionEventUrl).post('').reply(200, {})

      const event = createTestEvent(testEvent)

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings: {
          snap_app_id: '123',
          app_id: '123'
        },
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        mapping: {
          event_type: 'SAVE',
          event_conversion_type: 'MOBILE_APP'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"event_type\\":\\"SAVE\\",\\"event_conversion_type\\":\\"MOBILE_APP\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"snap_app_id\\":\\"123\\",\\"app_id\\":\\"123\\"}"`
      )
    })

    it('should fail invalid currency', async () => {
      nock(conversionEventUrl).post('').reply(400, {})

      const event = createTestEvent({
        ...testEvent,
        properties: {
          currency: 'Galleon'
        }
      })

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings,
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          mapping: {
            event_type: 'PURCHASE',
            event_conversion_type: 'WEB'
          }
        })
      ).rejects.toThrowError('Galleon is not a valid currency code.')
    })

    it('should fail missing event conversion type', async () => {
      nock(conversionEventUrl).post('').reply(400, {})

      const event = createTestEvent(testEvent)

      await expect(
        testDestination.testAction('reportConversionEvent', {
          event,
          settings,
          useDefaultMappings: true,
          auth: {
            accessToken,
            refreshToken
          },
          mapping: {
            event_type: 'PURCHASE'
          }
        })
      ).rejects.toThrowError("The root value is missing the required field 'event_conversion_type'.")
    })

    it('should handle a custom event', async () => {
      nock(conversionEventUrl).post('').reply(200, {})

      const event = createTestEvent({
        ...testEvent,
        event: 'CUSTOM_EVENT_5'
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings: {
          snap_app_id: '123',
          app_id: '123'
        },
        useDefaultMappings: true,
        auth: {
          accessToken,
          refreshToken
        },
        mapping: {
          event_type: { '@path': '$.event' },
          event_conversion_type: 'MOBILE_APP'
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"event_type\\":\\"CUSTOM_EVENT_5\\",\\"event_conversion_type\\":\\"MOBILE_APP\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"snap_app_id\\":\\"123\\",\\"app_id\\":\\"123\\"}"`
      )
    })
  })
})
