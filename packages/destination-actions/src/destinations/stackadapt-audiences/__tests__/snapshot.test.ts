import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-stackadapt-audiences'

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData,
      })
      event.properties!.marketing_status = 'Indeterminate'

      // Add required test data for specific actions
      let mapping = event.properties
      if (actionSlug === 'forwardAudienceEvent') {
        mapping = { ...event.properties, marketing_status: 'Indeterminate' }
      } else if (actionSlug === 'forwardProfile') {
        // Ensure forwardProfile has traits to avoid empty processing
        mapping = { 
          ...event.properties, 
          traits: { 
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            ...event.properties.traits 
          }
        }
      }

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: mapping,
        settings: settingsData,
        auth: undefined
      })

      if (!responses || responses.length === 0) {
        throw new Error(`No responses returned for action ${actionSlug}`)
      }

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
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/).persist().get(/.*/).reply(200)
      nock(/.*/).persist().post(/.*/).reply(200)
      nock(/.*/).persist().put(/.*/).reply(200)

      const event = createTestEvent({
        properties: eventData
      })

      // Add required test data for specific actions
      let mapping = event.properties
      if (actionSlug === 'forwardAudienceEvent') {
        mapping = { ...event.properties, marketing_status: 'Indeterminate' }
      } else if (actionSlug === 'forwardProfile') {
        // Ensure forwardProfile has traits to avoid empty processing
        mapping = { 
          ...event.properties, 
          traits: { 
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            ...event.properties.traits 
          }
        }
      }

      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: mapping,
        settings: settingsData,
        auth: undefined
      })

      if (!responses || responses.length === 0) {
        throw new Error(`No responses returned for action ${actionSlug}`)
      }

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