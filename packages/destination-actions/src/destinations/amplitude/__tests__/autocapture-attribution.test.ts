import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Amplitude from '../index'
import {AmplitudeAttributionValues, AmplitudeSetOnceAttributionValues, AmplitudeAttributionKey} from '@segment/actions-shared'

const testDestination = createTestIntegration(Amplitude)
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Amplitude', () => {
  describe('logEvent V2', () => {
    it('correctly handles autocapture attribution values passed in integrations object', async () => {
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

      const set_once: AmplitudeSetOnceAttributionValues = {
        initial_referrer: 'initial-referrer-from-integrations-object',
        initial_utm_campaign: 'initial-utm-campaign-from-integrations-object',
        initial_utm_content: 'initial-utm-content-from-integrations-object',
        initial_utm_medium: '',
        initial_utm_source: 'initial-utm-source-from-integrations-object',
        initial_utm_term: 'initial-utm-term-from-integrations-object',
        initial_gclid: 'initial-gclid-from-integrations-object',
        initial_fbclid: '',
        initial_dclid: '',
        initial_gbraid: '',
        initial_wbraid: '',
        initial_ko_clickid: '',
        initial_li_fat_id: '',
        initial_msclkid: '',
        initial_referring_domain: 'initial-referring-domain-from-integrations-object',
        initial_rtd_cid: '',
        initial_ttclid: '',
        initial_twclid: '',
        initial_utm_id: ''
      }

      const set: Partial<AmplitudeAttributionValues> = {
        referrer: 'referrer-from-integrations-object',
        utm_campaign: 'utm-campaign-from-integrations-object',
        utm_content: 'utm-content-from-integrations-object',
        utm_source: 'utm-source-from-integrations-object',
        utm_term: 'utm-term-from-integrations-object',
        gclid: 'gclid-from-integrations-object',
        referring_domain: 'referring-domain-from-integrations-object'
      }

      const unset: AmplitudeAttributionKey[] = [
        'utm_medium',
        'fbclid',
        'dclid',
        'gbraid',
        'wbraid',
        'ko_clickid',
        'li_fat_id',
        'msclkid',
        'rtd_cid',
        'ttclid',
        'twclid',
        'utm_id'
      ]

      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        traits: {
          otherTraits: {'some-trait-key': 'some-trait-value'},
          setTraits: {
            interests: ['music', 'sports'] // should get sent as normal set
          },
          setOnceTraits: {
            first_name: "Billybob" // should get sent as normal setOnce
          }
        },
        context: {
          integrations: {
            'Actions Amplitude': {
              autocapture_attribution: {
                enabled: true,
                set_once,
                set,
                unset
              }
            }
          },
          page: {
            referrer: 'referrer-from-page-context' // should get dropped
          },
          campaign: {
            name: 'campaign-name-from-campaign-context', // should get dropped
            source: 'campaign-source-from-campaign-context', // should get dropped
            medium: 'campaign-medium-from-campaign-context',// should get dropped
            term: 'campaign-term-from-campaign-context',// should get dropped
            content: 'campaign-content-from-campaign-context'// should get dropped
          }
        }
      })

      const responses = await testDestination.testAction(
        'logEventV2', 
        { 
          event, 
          useDefaultMappings: true,             
          mapping: {
              user_properties: { '@path': '$.traits.otherTraits' },
              setOnce: {
                initial_referrer: { '@path': '$.context.page.referrer' },
                initial_utm_source: { '@path': '$.context.campaign.source' },
                initial_utm_medium: { '@path': '$.context.campaign.medium' },
                initial_utm_campaign: { '@path': '$.context.campaign.name' },
                initial_utm_term: { '@path': '$.context.campaign.term' },
                initial_utm_content: { '@path': '$.context.campaign.content' },
                first_name: { '@path': '$.traits.setOnceTraits.first_name' }
              },
              setAlways: {
                referrer: { '@path': '$.context.page.referrer' },
                utm_source: { '@path': '$.context.campaign.source' },
                utm_medium: { '@path': '$.context.campaign.medium' },
                utm_campaign: { '@path': '$.context.campaign.name' },
                utm_term: { '@path': '$.context.campaign.term' },
                utm_content: { '@path': '$.context.campaign.content' },
                interests: { '@path': '$.traits.setTraits.interests' }
              }
          }
        }
      )

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toEqual({
        api_key: undefined,
        events: [
          {
            device_id: "anonId1234",
            event_properties: {},
            event_type: "Test Event",
            library: "segment",
            time: 1629213675449,
            use_batch_endpoint: false,
            user_id: "user1234",
            user_properties: {
              $set: {
                interests: ["music", "sports"], // carried over from the setAlways mapping
                gclid: "gclid-from-integrations-object",
                referrer: "referrer-from-integrations-object",
                referring_domain: "referring-domain-from-integrations-object",
                utm_campaign: "utm-campaign-from-integrations-object",
                utm_content: "utm-content-from-integrations-object",
                utm_source: "utm-source-from-integrations-object",
                utm_term: "utm-term-from-integrations-object",
              },
              $setOnce: {
                first_name: "Billybob", // carried over from the setOnce mapping
                initial_dclid: "",
                initial_fbclid: "",
                initial_gbraid: "",
                initial_gclid: "initial-gclid-from-integrations-object",
                initial_ko_clickid: "",
                initial_li_fat_id: "",
                initial_msclkid: "",
                initial_referrer: "initial-referrer-from-integrations-object",
                initial_referring_domain: "initial-referring-domain-from-integrations-object",
                initial_rtd_cid: "",
                initial_ttclid: "",
                initial_twclid: "",
                initial_utm_campaign: "initial-utm-campaign-from-integrations-object",
                initial_utm_content: "initial-utm-content-from-integrations-object",
                initial_utm_id: "",
                initial_utm_medium: "",
                initial_utm_source: "initial-utm-source-from-integrations-object",
                initial_utm_term: "initial-utm-term-from-integrations-object",
                initial_wbraid: "",
              },
              $unset: [
                "utm_medium",
                "fbclid",
                "dclid",
                "gbraid",
                "wbraid",
                "ko_clickid",
                "li_fat_id",
                "msclkid",
                "rtd_cid",
                "ttclid",
                "twclid",
                "utm_id",
              ],
              "some-trait-key": "some-trait-value",
            },
          },
        ],
        options: undefined,
      })
    })
  })
})
