import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Amplitude from '../index'

const testDestination = createTestIntegration(Amplitude)
const timestamp = '2021-08-17T15:21:15.449Z'

describe('Amplitude', () => {

  describe('logEvent V2', () => {

    it('correctly handles the default mappings for setOnce, setAlways, and add', async () => {
      nock('https://api2.amplitude.com/2').post('/httpapi').reply(200, {})

      const event = createTestEvent({
        timestamp,
        event: 'Test Event',
        traits: {
          'some-trait-key': 'some-trait-value'
        },
        context: {
          page: {
            referrer: 'some-referrer'
          },
          campaign: {
            name: 'TPS Innovation Newsletter',
            source: 'Newsletter',
            medium: 'email',
            term: 'tps reports',
            content: 'image link'
          }
        }
      })

      const responses = await testDestination.testAction('logEventV2', { event, useDefaultMappings: true })
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject({
        api_key: undefined,
        events: expect.arrayContaining([
          expect.objectContaining({
            user_properties: expect.objectContaining({
              $set: {
                referrer: 'some-referrer',
                utm_campaign: 'TPS Innovation Newsletter',
                utm_content: 'image link',
                utm_medium: 'email',
                utm_source: 'Newsletter',
                utm_term: 'tps reports'
              },
              $setOnce: {
                initial_referrer: 'some-referrer',
                initial_utm_campaign: 'TPS Innovation Newsletter',
                initial_utm_content: 'image link',
                initial_utm_medium: 'email',
                initial_utm_source: 'Newsletter',
                initial_utm_term: 'tps reports'
              }
            })
          })
        ])
      })
    })
  })

})
