import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Amplitude from '../index'
import {AmplitudeAttributionValues, AmplitudeSetOnceAttributionValues, AmplitudeAttributionUnsetValues} from '@segment/actions-shared'

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
        initial_utm_medium: 'EMPTY',
        initial_utm_source: 'initial-utm-source-from-integrations-object',
        initial_utm_term: 'initial-utm-term-from-integrations-object',
        initial_gclid: 'initial-gclid-from-integrations-object',
        initial_fbclid: 'EMPTY',
        initial_dclid: 'EMPTY',
        initial_gbraid: 'EMPTY',
        initial_wbraid: 'EMPTY',
        initial_ko_clickid: 'EMPTY',
        initial_li_fat_id: 'EMPTY',
        initial_msclkid: 'EMPTY',
        initial_referring_domain: 'initial-referring-domain-from-integrations-object',
        initial_rtd_cid: 'EMPTY',
        initial_ttclid: 'EMPTY',
        initial_twclid: 'EMPTY',
        initial_utm_id: 'EMPTY'
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

      const unset: Partial<AmplitudeAttributionUnsetValues> = {
        utm_medium: '-',
        fbclid: '-',
        dclid: '-',
        gbraid: '-',
        wbraid: '-',
        ko_clickid: '-',
        li_fat_id: '-',
        msclkid: '-',
        rtd_cid: '-',
        ttclid: '-',
        twclid: '-',
        utm_id: '-'
      }

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
        context: {
          
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
                initial_dclid: "EMPTY",
                initial_fbclid: "EMPTY",
                initial_gbraid: "EMPTY",
                initial_gclid: "initial-gclid-from-integrations-object",
                initial_ko_clickid: "EMPTY",
                initial_li_fat_id: "EMPTY",
                initial_msclkid: "EMPTY",
                initial_referrer: "initial-referrer-from-integrations-object",
                initial_referring_domain: "initial-referring-domain-from-integrations-object",
                initial_rtd_cid: "EMPTY",
                initial_ttclid: "EMPTY",
                initial_twclid: "EMPTY",
                initial_utm_campaign: "initial-utm-campaign-from-integrations-object",
                initial_utm_content: "initial-utm-content-from-integrations-object",
                initial_utm_id: "EMPTY",
                initial_utm_medium: "EMPTY",
                initial_utm_source: "initial-utm-source-from-integrations-object",
                initial_utm_term: "initial-utm-term-from-integrations-object",
                initial_wbraid: "EMPTY",
              },
              $unset: {
                utm_medium: '-',
                fbclid: '-',
                dclid: '-',
                gbraid: '-',
                wbraid: '-',
                ko_clickid: '-',
                li_fat_id: '-',
                msclkid: '-',
                rtd_cid: '-',
                ttclid: '-',
                twclid: '-',
                utm_id: '-',
              },
              "some-trait-key": "some-trait-value",
            },
          },
        ],
        options: undefined,
      })
    })

    it('Blocks utm and referrer data if autocapture attribution is enabled', async () => {
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

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
        integrations: {
          'Actions Amplitude': {
            autocapture_attribution: {
              enabled: true,
              set_once: {}, // no attribution values provided, however we'll ignore the mappged values as enabled is true
              set: {},
              unset: {}
            }
          }
        },
        context: {
          page: {
            referrer: 'referrer-from-page-context' // should get ignored
          },
          campaign: {
            name: 'campaign-name-from-campaign-context', // should get ignored
            source: 'campaign-source-from-campaign-context', // should get ignored
            medium: 'campaign-medium-from-campaign-context',// should get ignored
            term: 'campaign-term-from-campaign-context',// should get ignored
            content: 'campaign-content-from-campaign-context'// should get ignored
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
              },
              $setOnce: {
                first_name: "Billybob", // carried over from the setOnce mapping
              },
              "some-trait-key": "some-trait-value",
            },
          },
        ],
        options: undefined,
      })
    })

    it('regular mapped utm and referrer data is sent when autocapture attribution is disabled', async () => {
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

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
        integrations: {
          'Actions Amplitude': {
            autocapture_attribution: {
              // enabled: true, // Disabled autocapture attribution
              set_once: {}, 
              set: {},
              unset: {}
            }
          }
        },
        context: {
          page: {
            referrer: 'referrer-from-page-context' // should get handled normally
          },
          campaign: {
            name: 'campaign-name-from-campaign-context', // should get handled normally
            source: 'campaign-source-from-campaign-context', // should get handled normally
            medium: 'campaign-medium-from-campaign-context',// should get handled normally
            term: 'campaign-term-from-campaign-context',// should get handled normally
            content: 'campaign-content-from-campaign-context'// should get handled normally
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
                interests: ["music", "sports"],
                referrer: "referrer-from-page-context",
                utm_campaign: "campaign-name-from-campaign-context",
                utm_content: "campaign-content-from-campaign-context",
                utm_medium: "campaign-medium-from-campaign-context",
                utm_source: "campaign-source-from-campaign-context",
                utm_term: "campaign-term-from-campaign-context"
              },
              $setOnce: {
                first_name: "Billybob",
                initial_referrer: "referrer-from-page-context",
                initial_utm_campaign: "campaign-name-from-campaign-context",
                initial_utm_content: "campaign-content-from-campaign-context",
                initial_utm_medium: "campaign-medium-from-campaign-context",
                initial_utm_source: "campaign-source-from-campaign-context",
                initial_utm_term: "campaign-term-from-campaign-context"
              },
              "some-trait-key": "some-trait-value"
            }
          }
        ],
        options: undefined
      })
    })
  })
})
