import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const conversionTrackingId = '_conversion_id_'
const conversionLabel = '_conversion_'

describe('GoogleEnhancedConversions', () => {
  describe('postConversion', () => {
    it('should should send an event with default mappings', async () => {
      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        properties: {
          email: 'janedoe@gmail.com',
          orderId: '123',
          firstName: 'Bob John',
          lastName: 'Smith',
          phone: '14150000000',
          address: {
            street: '123 Market Street',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94000',
            country: 'USA'
          }
        }
      })

      nock('https://www.google.com/ads/event/api/v1')
        .post(`?conversion_tracking_id=${conversionTrackingId}`)
        .reply(201, {})

      const responses = await testDestination.testAction('postConversion', {
        event,
        mapping: { conversion_label: conversionLabel },
        useDefaultMappings: true,
        settings: {
          conversionTrackingId
        }
      })

      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"pii_data\\":{\\"hashed_email\\":\\"1hFzBkhe0OUK+rOshx6Y+BaZFR8wKBUn1j/18jNlbGk=\\",\\"hashed_phone_number\\":[\\"5pAiami9y4LWCmP12H9fXJpoqrnOFRL7u9q1pkqlMmI=\\"],\\"address\\":[{\\"hashed_first_name\\":\\"IGT0sXMskUo9vWuqGeOhA+RylOG2Oj/IcIX2Zr5f7GU=\\",\\"hashed_last_name\\":\\"ZieDX5iOLF5QUz1JEWMHLT9PQfXIsEYwFQ3rs3Isot0=\\",\\"hashed_street_address\\":\\"tHP71r8+GY59XKpmdb6ssI3fd7TIBB6E6aCWN06RGBw=\\",\\"city\\":\\"sanfrancisco\\",\\"region\\":\\"ca\\",\\"postcode\\":\\"94000\\",\\"country\\":\\"USA\\"}]},\\"oid\\":\\"123\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"conversion_time\\":1623348484000000,\\"label\\":\\"_conversion_\\"}"`
      )

      expect(responses[0].options.searchParams).toMatchInlineSnapshot(`
        Object {
          "conversion_tracking_id": "_conversion_id_",
        }
      `)

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })
  })
})
