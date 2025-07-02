import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'triggerCanvas'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    // Add the required targeting parameter (recipients array with minimal required field)
    delete eventData.audience // Ensure only one targeting parameters are used
    const modifiedEventData = {
      ...eventData,
      recipients: [
        {
          external_user_id: 'test-user-123',
          send_to_existing_only: true
        }
      ]
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: modifiedEventData
    })
    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: modifiedEventData,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    delete eventData.audience // Ensure only one targeting parameters are used
    delete eventData.broadcast // Remove broadcast to avoid conflict with recipients
    eventData.recipients[0].user_alias = {
      alias_name: 'test-alias',
      alias_label: 'test-alias-label'
    }
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

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
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
    expect(request.headers).toMatchSnapshot()
  })

  // Test with recipients array
  it('with recipients array', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    delete eventData.audience // Ensure only one targeting parameters are used
    delete eventData.broadcast // Remove broadcast to avoid conflict with recipients
    // Ensure we have recipients data
    const customEventData = {
      ...eventData,
      recipients: [
        {
          external_user_id: 'user-123',
          email: 'test@example.com',
          send_to_existing_only: true,
          canvas_entry_properties: {
            name: 'John Doe',
            customData: 'test'
          }
        },
        {
          external_user_id: 'user-456',
          email: 'another@example.com',
          send_to_existing_only: true
        }
      ]
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: customEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: customEventData,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
    expect(request.headers).toMatchSnapshot()
  })

  // Test with audience object
  it('with audience object', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    // Create a test with audience data and broadcast true
    const customEventData = {
      ...eventData,
      broadcast: true, // Required when using audience without recipients
      audience: {
        AND: [
          { custom_attribute: { attribute_name: 'eye_color', comparison: 'equals', value: 'blue' } },
          { custom_attribute: { attribute_name: 'age', comparison: 'greater_than', value: 30 } }
        ]
      }
      // recipients not included when broadcast is true
    }
    // Remove recipients since we're using broadcast
    delete customEventData.recipients

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: customEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: customEventData,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
    expect(request.headers).toMatchSnapshot()
  })

  // Test with canvas entry properties
  it('with canvas entry properties', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    delete eventData.audience // Ensure only one targeting parameters are used
    delete eventData.broadcast // Remove broadcast to avoid conflict with recipients
    // Create a test with canvas entry properties
    const customEventData = {
      ...eventData,
      canvas_entry_properties: {
        product_name: 'Test Product',
        discount_amount: 25,
        user_tier: 'premium'
      }
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: customEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: customEventData,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
    expect(request.headers).toMatchSnapshot()
  })

  // Test with prioritization
  it('with prioritization', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    delete eventData.audience // Ensure only one targeting parameters are used
    delete eventData.broadcast // Remove broadcast to avoid conflict with recipients
    // Create a test with prioritization
    const customEventData = {
      ...eventData,
      recipients: [
        {
          external_user_id: 'user-123',
          email: 'test@example.com',
          send_to_existing_only: true
        }
      ],
      prioritization: {
        first_priority: 'identified',
        second_priority: 'most_recently_updated'
      }
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: customEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: customEventData,
      settings: settingsData,
      auth: undefined
    })

    const request = responses[0].request
    const rawBody = await request.text()

    try {
      const json = JSON.parse(rawBody)
      expect(json).toMatchSnapshot()
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
    expect(request.headers).toMatchSnapshot()
  })
})
