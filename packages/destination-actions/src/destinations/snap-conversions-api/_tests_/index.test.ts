import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { Settings } from '../generated-types'
import { defaultValues } from '@segment/actions-core'

import reportConversionEvent from '../reportConversionEvent'

const DEFAULT_VALS = {
  ...defaultValues(reportConversionEvent.fields)
}

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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"PURCHASE\\",\\"event_conversion_type\\":\\"WEB\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"pixel_id\\":\\"test123\\"}"`
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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"SAVE\\",\\"event_conversion_type\\":\\"OFFLINE\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"pixel_id\\":\\"test123\\"}"`
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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"SAVE\\",\\"event_conversion_type\\":\\"MOBILE_APP\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"snap_app_id\\":\\"123\\",\\"app_id\\":\\"123\\"}"`
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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"CUSTOM_EVENT_5\\",\\"event_conversion_type\\":\\"MOBILE_APP\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"snap_app_id\\":\\"123\\",\\"app_id\\":\\"123\\"}"`
      )
    })

    it('should fail event missing all Snap identifiers', async () => {
      const event = createTestEvent({
        ...testEvent,
        properties: {},
        context: {}
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
      ).rejects.toThrowError(
        'Payload must contain values for Email or Phone Number or Mobile Ad Identifier or both IP Address and User Agent fields'
      )
    })

    it('should handle event with email as only Snap identifier', async () => {
      nock(conversionEventUrl).post('').reply(200, {})
      const event = createTestEvent({
        ...testEvent,
        properties: {
          email: 'test123@gmail.com'
        },
        context: {}
      })

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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"PURCHASE\\",\\"event_conversion_type\\":\\"WEB\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"pixel_id\\":\\"test123\\"}"`
      )
    })

    it('should handle event with phone as only Snap identifier', async () => {
      nock(conversionEventUrl).post('').reply(200, {})
      const event = createTestEvent({
        ...testEvent,
        properties: {
          phone: '+44 844 412 4653'
        },
        context: {}
      })

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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"PURCHASE\\",\\"event_conversion_type\\":\\"WEB\\",\\"timestamp\\":1652368875449,\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"pixel_id\\":\\"test123\\"}"`
      )
    })

    it('should handle event with advertising_id as only Snap identifier', async () => {
      nock(conversionEventUrl).post('').reply(200, {})
      const event = createTestEvent({
        ...testEvent,
        properties: {},
        context: {
          device: {
            advertisingId: '87a7def4-b6e9-4bf7-91b6-66372842007a'
          }
        }
      })

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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"PURCHASE\\",\\"event_conversion_type\\":\\"WEB\\",\\"timestamp\\":1652368875449,\\"hashed_mobile_ad_id\\":\\"5af103f270fdc673b5e121ea929d1e47b2cee679e2059226a23c4cba37f8c9a9\\",\\"pixel_id\\":\\"test123\\"}"`
      )
    })

    it('should handle event with ip and user_agent as only Snap identifiers', async () => {
      nock(conversionEventUrl).post('').reply(200, {})
      const event = createTestEvent({
        ...testEvent,
        properties: {}
      })

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
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"PURCHASE\\",\\"event_conversion_type\\":\\"WEB\\",\\"timestamp\\":1652368875449,\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"pixel_id\\":\\"test123\\"}"`
      )
    })

    it('should handle event with optional parameters', async () => {
      nock(conversionEventUrl).post('').reply(200, {})

      const event = createTestEvent({
        ...testEvent,
        properties: {
          ...testEvent.properties,
          idfv: 'C305F2DB-56FC-404F-B6C1-BC52E0B680D8',
          first_name: 'John',
          middle_name: 'Middle',
          last_name: 'Doe',
          city: 'Santa Monica',
          state: 'CA',
          zip: '90405',
          dob_month: 'January',
          dob_day: '26',
          country: 'US',
          region: 'CA'
        }
      })

      const responses = await testDestination.testAction('reportConversionEvent', {
        event,
        settings,
        useDefaultMappings: false,
        auth: {
          accessToken,
          refreshToken
        },
        mapping: {
          ...DEFAULT_VALS,
          event_type: 'PURCHASE',
          event_conversion_type: 'WEB',
          idfv: { '@path': '$.properties.idfv' },
          first_name: { '@path': '$.properties.first_name' },
          middle_name: { '@path': '$.properties.middle_name' },
          last_name: { '@path': '$.properties.last_name' },
          city: { '@path': '$.properties.city' },
          state: { '@path': '$.properties.state' },
          zip: { '@path': '$.properties.zip' },
          dob_month: { '@path': '$.properties.dob_month' },
          dob_day: { '@path': '$.properties.dob_day' },
          country: { '@path': '$.properties.country' },
          region: { '@path': '$.properties.region' }
        }
      })

      expect(responses).not.toBeNull()
      expect(responses[0].status).toBe(200)

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"integration\\":\\"segment\\",\\"event_type\\":\\"PURCHASE\\",\\"event_conversion_type\\":\\"WEB\\",\\"timestamp\\":1652368875449,\\"hashed_email\\":\\"cc779c04191c2e736d89e45c11339c8382832bcaf70383f7df94e3d08ba7a6d9\\",\\"hashed_idfv\\":\\"f18c8b858e52b0c49f7db8f813538db0ecdc513357efd62c525784a9beb617d6\\",\\"hashed_phone_number\\":\\"dc008fda46e2e64002cf2f82a4906236282d431c4f75e5b60bfe79fc48546383\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"hashed_ip_address\\":\\"838c4c2573848f58e74332341a7ca6bc5cd86a8aec7d644137d53b4d597f10f5\\",\\"price\\":15,\\"currency\\":\\"USD\\",\\"page_url\\":\\"https://segment.com/academy/\\",\\"hashed_first_name_sha\\":\\"a8cfcd74832004951b4408cdb0a5dbcd8c7e52d43f7fe244bf720582e05241da\\",\\"hashed_middle_name_sha\\":\\"d93006ec2e4339d770a7afd068c1f1e789a52df12f595e529fd0f302fc1e5ec7\\",\\"hashed_last_name_sha\\":\\"fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7\\",\\"hashed_city_sha\\":\\"ced2e77f732fbf327f53e1f9748078c778b190ed9cf376a7df469a92d2ad62d3\\",\\"hashed_state_sha\\":\\"4b650e5c4785025dee7bd65e3c5c527356717d7a1c0bfef5b4ada8ca1e9cbe17\\",\\"hashed_zip\\":\\"e222c384dd83ac669bcd1da281ffea2e60bab298f8c0673d35bc0b704e345282\\",\\"hashed_dob_month\\":\\"37082e68df858e0ba76442174128811135890ae4c2c5df8b6f31aef5885d0be7\\",\\"hashed_dob_day\\":\\"5f9c4ab08cac7457e9111a30e4664920607ea2c115a1433d7be98e97e64244ca\\",\\"country\\":\\"US\\",\\"region\\":\\"CA\\",\\"pixel_id\\":\\"test123\\"}"`
      )
    })
  })
})
