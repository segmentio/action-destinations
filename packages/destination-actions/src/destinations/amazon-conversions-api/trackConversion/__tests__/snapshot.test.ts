import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'trackConversion'
const destinationSlug = 'AmazonConversionsApi'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
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

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
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

  it('all fields', async () => {
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

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
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
})
