import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'amazon-conversions-api'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      let [eventData, settingsData] = generateTestData(seedName, destination, action, true)
      
      // Ensure settingsData has required region field with proper URL
      settingsData = {
        ...settingsData,
        region: 'https://advertising-api.amazon.com',
        advertiserId: 'test-advertiser-id',
        profileId: 'test-profile-id'
      }

      // Mock specific Amazon API requests with proper URL
      nock('https://advertising-api.amazon.com')
        .persist()
        .post('/events/v1')
        .reply(207, { 
          error: [],
          success: [
            {
              index: 1,
              message: null
            }
          ]
        })

      const event = createTestEvent({
        properties: eventData
      })

      // Make sure enable_batching and valid countryCode are included for trackConversion action
      let mapping = event.properties
      if (actionSlug === 'trackConversion') {
        mapping = {
          ...event.properties,
          enable_batching: true,
          countryCode: 'US'  // Add valid country code in ISO format
        }
      }

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: mapping,
        settings: settingsData,
        auth: undefined
      })

      const request = responses[0].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot()
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }

      expect(request.headers).toMatchSnapshot()
    })

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      let [eventData, settingsData] = generateTestData(seedName, destination, action, false)
      
      // Ensure settingsData has required region field with proper URL
      settingsData = {
        ...settingsData,
        region: 'https://advertising-api.amazon.com',
        advertiserId: 'test-advertiser-id',
        profileId: 'test-profile-id'
      }

      // Mock specific Amazon API requests with proper URL
      nock('https://advertising-api.amazon.com')
        .persist()
        .post('/events/v1')
        .reply(207, { 
          error: [],
          success: [
            {
              index: 1,
              message: null
            }
          ]
        })

      const event = createTestEvent({
        properties: eventData
      })

      // Make sure enable_batching and valid countryCode are included for trackConversion action
      let mapping = event.properties
      if (actionSlug === 'trackConversion') {
        mapping = {
          ...event.properties,
          enable_batching: true,
          countryCode: 'US'  // Add valid country code in ISO format
        }
      }

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: mapping,
        settings: settingsData,
        auth: undefined
      })

      const request = responses[0].request
      const rawBody = await request.text()

      try {
        const json = JSON.parse(rawBody)
        expect(json).toMatchSnapshot()
        return
      } catch (err) {
        expect(rawBody).toMatchSnapshot()
      }
    })
  }
})
