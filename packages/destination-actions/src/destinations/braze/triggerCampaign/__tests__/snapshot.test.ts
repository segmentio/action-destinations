import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'triggerCampaign'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    // Add the required targeting parameter (recipients array with minimal required field)
    const modifiedEventData = {
      ...eventData,
      recipients: [
        {
          external_user_id: 'test-user-123'
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

    // Ensure we have recipients data
    const customEventData = {
      ...eventData,
      recipients: [
        {
          external_user_id: 'user-123',
          email: 'test@example.com',
          trigger_properties: {
            name: 'John Doe',
            customData: 'test'
          }
        },
        {
          external_user_id: 'user-456',
          email: 'another@example.com'
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

    // Create a test with audience data
    const customEventData = {
      ...eventData,
      audience: {
        AND: [
          { custom_attribute: { attribute_name: 'eye_color', comparison: 'equals', value: 'blue' } },
          { custom_attribute: { attribute_name: 'age', comparison: 'greater_than', value: 30 } }
        ]
      },
      recipients: [] // Empty array instead of undefined
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

  // Test with attachments
  it('with attachments', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    // Create a test with attachments
    const customEventData = {
      ...eventData,
      attachments: [
        {
          file_name: 'test-document.pdf',
          url: 'https://example.com/test-document.pdf'
        },
        {
          file_name: 'image.jpg',
          url: 'https://example.com/image.jpg'
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

  // Test error case when no targeting parameter is provided
  it('throws error when no targeting parameter is provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create invalid test data with no targeting params
    const invalidEventData = {
      campaign_id: 'campaign-123',
      // Remove all targeting parameters
      broadcast: false,
      recipients: [],
      audience: null
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: invalidEventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: invalidEventData,
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError('One of "recipients", "broadcast" or "audience", must be provided.')
  })

  // Test error case when campaign_id is missing
  it('throws error when campaign_id is not provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create invalid test data with no campaign_id
    const invalidEventData = {
      // Missing campaign_id
      broadcast: true,
      audience: null
    }

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: invalidEventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: invalidEventData,
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError("The root value is missing the required field 'campaign_id'.")
  })
})
