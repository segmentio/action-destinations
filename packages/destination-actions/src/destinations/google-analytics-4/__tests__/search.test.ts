import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import ga4 from '../index'

const testDestination = createTestIntegration(ga4)
const apiSecret = 'b287432uhkjHIUEL'
const measurementId = 'G-TESTTOKEN'

describe('GA4', () => {
  describe('Products Searched', () => {
    //basic event test
    it('should handle a basic event with default mappings', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Products Searched',
        userId: '3456fff',
        type: 'track',
        properties: {
          query: 'milk and cookies'
        }
      })
      const responses = await testDestination.testAction('search', {
        event,
        settings: {
          apiSecret,
          measurementId
        },
        useDefaultMappings: true
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(201)
    })

    //event without query term event
    it('should throw an error for an empty search term', async () => {
      nock('https://www.google-analytics.com/mp/collect')
        .post(`?measurement_id=${measurementId}&api_secret=${apiSecret}`)
        .reply(201, {})
      const event = createTestEvent({
        event: 'Products Searched',
        userId: '3456fff',
        type: 'track'
      })
      try {
        await testDestination.testAction('search', {
          event,
          settings: {
            apiSecret,
            measurementId
          },
          useDefaultMappings: true
        })
        fail('the test should have thrown an error')
      } catch (e) {
        expect(e.message).toBe("The root value is missing the required field 'search_term'.")
      }
    })
  })
})
