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
    // Ensure we have recipients data
    const customEventData = {
      ...eventData,
      recipients: [
        {
          external_user_id: 'user-123',
          email: 'test@example.com',
          send_to_existing_only: true,
          trigger_properties: {
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
    delete eventData.audience // Ensure only one targeting parameters are used
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
})
