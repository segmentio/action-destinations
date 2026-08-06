import nock from 'nock'
import { createTestEvent, createTestIntegration, FLAGS } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION } from '../functions'

// These tests exercise the Journeys `presets` declared in ../index.ts (type: 'specificEvent').
// Each preset says "when a Journeys event matching `eventSlug` is received, invoke
// `partnerAction` using `mapping` as the default field mapping." We build a realistic event
// for the eventSlug, invoke the preset's partnerAction with the preset's own mapping object
// (not useDefaultMappings), and assert the resulting API request body is correct. This proves
// the preset's mapping actually extracts the right data - not just that the action doesn't throw.

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()

function getPreset(partnerAction: string, eventSlug: string) {
  const preset = GoogleEnhancedConversions.presets?.find(
    (p) => p.partnerAction === partnerAction && p.type === 'specificEvent' && p.eventSlug === eventSlug
  )
  if (!preset) {
    throw new Error(`Could not find a preset for partnerAction="${partnerAction}" eventSlug="${eventSlug}"`)
  }
  return preset
}

describe('GoogleEnhancedConversions Journeys presets', () => {
  describe('"Journeys Step Entered" -> userList', () => {
    it('uses the preset mapping to add a user to a Customer Match list', async () => {
      const preset = getPreset('userList', 'journeys_step_entered_track')
      const customerId = '1234'

      // A real "Journeys Step Entered" event carries the journey_step computation context but,
      // unlike "Journey Step All Events", never carries a membership boolean. With the legacy
      // journeys flag on, that resolves to an add.
      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: 'Journeys Step Entered',
        context: {
          personas: {
            computation_class: 'journey_step',
            computation_key: 'personas_test_audience'
          }
        },
        properties: {
          email: 'test@gmail.com',
          phone: '3234567890',
          firstName: 'Jane',
          lastName: 'Doe'
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`)
        .post(/.*/)
        .reply(200, { data: 'offlineDataJob' })

      const responses = await testDestination.testAction(preset.partnerAction, {
        event,
        mapping: {
          ...(preset.mapping ?? {}),
          // Required consent fields and the connect-a-list hook are not part of the preset's
          // mapping (the preset only pre-fills fields that have a schema default) - a customer
          // would fill these in when they save the mapping in the UI.
          ad_user_data_consent_state: 'GRANTED',
          ad_personalization_consent_state: 'GRANTED',
          retlOnMappingSave: {
            outputs: {
              id: '1234',
              name: 'Journeys List',
              external_id_type: 'CONTACT_INFO'
            }
          }
        },
        useDefaultMappings: false,
        settings: {
          customerId
        },
        features: {
          [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: true
        }
      })

      expect(responses.length).toEqual(3)
      expect(responses[0].options.body).toEqual(
        JSON.stringify({
          job: {
            type: 'CUSTOMER_MATCH_USER_LIST',
            customerMatchUserListMetadata: {
              userList: 'customers/1234/userLists/1234',
              consent: { adUserData: 'GRANTED', adPersonalization: 'GRANTED' }
            }
          }
        })
      )
      expect(responses[1].options.body).toEqual(
        JSON.stringify({
          operations: [
            {
              create: {
                userIdentifiers: [
                  { hashedEmail: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674' },
                  { hashedPhoneNumber: '0506a1f3f4c515fd310fce54d253b731f71e33e7e7d2b10848528ca4411120b0' },
                  {
                    addressInfo: {
                      hashedFirstName: '4f23798d92708359b734a18172c9c864f1d48044a754115a0d4b843bca3a5332',
                      hashedLastName: 'fd53ef835b15485572a6e82cf470dcb41fd218ae5751ab7531c956a2a6bcd3c7',
                      countryCode: '',
                      postalCode: ''
                    }
                  }
                ]
              }
            }
          ],
          enable_warnings: true
        })
      )
    })
  })

  describe('"Journeys Step Entered" -> postConversion', () => {
    it('uses the preset mapping to upload a legacy enhanced conversion', async () => {
      const preset = getPreset('postConversion', 'journeys_step_entered_track')
      const conversionTrackingId = '_conversion_id_'
      const conversionLabel = '_conversion_'

      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: 'Journeys Step Entered',
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

      const responses = await testDestination.testAction(preset.partnerAction, {
        event,
        mapping: {
          ...(preset.mapping ?? {}),
          // conversion_label defaults to '' in the field schema (there is no sensible default
          // for a Google-specific label) - a customer supplies the real value when saving.
          conversion_label: conversionLabel
        },
        useDefaultMappings: false,
        settings: {
          conversionTrackingId
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"pii_data\\":{\\"hashed_email\\":\\"1hFzBkhe0OUK-rOshx6Y-BaZFR8wKBUn1j_18jNlbGk=\\",\\"hashed_phone_number\\":[\\"5pAiami9y4LWCmP12H9fXJpoqrnOFRL7u9q1pkqlMmI=\\"],\\"address\\":[{\\"hashed_first_name\\":\\"IGT0sXMskUo9vWuqGeOhA-RylOG2Oj_IcIX2Zr5f7GU=\\",\\"hashed_last_name\\":\\"ZieDX5iOLF5QUz1JEWMHLT9PQfXIsEYwFQ3rs3Isot0=\\",\\"hashed_street_address\\":\\"tHP71r8-GY59XKpmdb6ssI3fd7TIBB6E6aCWN06RGBw=\\",\\"city\\":\\"sanfrancisco\\",\\"region\\":\\"ca\\",\\"postcode\\":\\"94000\\",\\"country\\":\\"USA\\"}]},\\"oid\\":\\"123\\",\\"user_agent\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\",\\"conversion_time\\":1623348484000000,\\"label\\":\\"_conversion_\\"}"`
      )
    })
  })

  describe('"Journeys Step Entered" -> uploadClickConversion', () => {
    it('uses the preset mapping to upload a click conversion', async () => {
      const preset = getPreset('uploadClickConversion', 'journeys_step_entered_track')
      const customerId = '1234'

      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: 'Journeys Step Entered',
        properties: {
          email: 'test@gmail.com',
          phone: '6161729102',
          orderId: '1234',
          total: '200',
          currency: 'USD',
          products: [
            {
              product_id: '1234',
              quantity: 3,
              price: 10.99
            }
          ]
        }
      })

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`)
        .post('')
        .reply(201, { results: [{}] })

      const responses = await testDestination.testAction(preset.partnerAction, {
        event,
        mapping: {
          ...(preset.mapping ?? {}),
          // conversion_action is required but has no schema default (it's a dynamic lookup
          // against the customer's Google Ads account) - a customer supplies it when saving.
          conversion_action: '12345'
        },
        useDefaultMappings: false,
        settings: {
          customerId
        }
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
      expect(responses[0].options.body).toMatchInlineSnapshot(
        `"{\\"conversions\\":[{\\"conversionAction\\":\\"customers/1234/conversionActions/12345\\",\\"conversionDateTime\\":\\"2021-06-10 18:08:04+00:00\\",\\"userIpAddress\\":\\"8.8.8.8\\",\\"sessionAttributesKeyValuePairs\\":{\\"keyValuePairs\\":[{\\"sessionAttributeKey\\":\\"landing_page_url\\",\\"sessionAttributeValue\\":\\"https://segment.com/academy/\\"},{\\"sessionAttributeKey\\":\\"landing_page_user_agent\\",\\"sessionAttributeValue\\":\\"Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1\\"}]},\\"orderId\\":\\"1234\\",\\"conversionValue\\":200,\\"currencyCode\\":\\"USD\\",\\"cartData\\":{\\"items\\":[{\\"productId\\":\\"1234\\",\\"quantity\\":3,\\"unitPrice\\":10.99}]},\\"userIdentifiers\\":[{\\"hashedEmail\\":\\"87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674\\"},{\\"hashedPhoneNumber\\":\\"76ff44c6428f2fc2750fec01cb3190423adaebb21e797d942f339f3c7c1761dd\\"}]}],\\"partialFailure\\":true}"`
      )
    })
  })
})
