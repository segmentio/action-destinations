import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'triggerCampaign'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Unit tests for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  // Test error case when neither broadcast nor recipients is provided
  it('throws error when neither broadcast nor recipients is provided', async () => {
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
    ).rejects.toThrowError('Either "broadcast" must be true or "recipients" list must be provided.')
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

  // Test error case: broadcast is true and recipients are provided
  it('throws error when broadcast is true and recipients are provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with both broadcast and recipients
    const invalidEventData = {
      campaign_id: 'campaign-123',
      broadcast: true,
      recipients: [{ external_user_id: 'user-123', send_to_existing_only: true }],
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
    ).rejects.toThrowError('When "broadcast" is true, "recipients" list cannot be included.')
  })

  // Test success case: broadcast with optional audience
  it('allows broadcast with optional audience', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create valid test data with broadcast and audience
    const validEventData = {
      campaign_id: 'campaign-123',
      broadcast: true,
      audience: {
        AND: [
          {
            custom_attribute: {
              custom_attribute_name: 'test_attribute',
              comparison: 'equals',
              value: 'test_value'
            }
          }
        ]
      }
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/campaigns/trigger/send', (body) => {
        expect(body.campaign_id).toBe('campaign-123')
        expect(body.broadcast).toBe(true)
        expect(body.audience).toBeDefined()
        expect(body.recipients).toBeUndefined()
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test success case: broadcast without audience
  it('allows broadcast without audience', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create valid test data with just broadcast
    const validEventData = {
      campaign_id: 'campaign-123',
      broadcast: true
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/campaigns/trigger/send', (body) => {
        expect(body.campaign_id).toBe('campaign-123')
        expect(body.broadcast).toBe(true)
        expect(body.recipients).toBeUndefined()
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test to verify prioritization object transforms correctly
  it('transforms prioritization object into array and applies to recipients', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with recipients and prioritization
    const validEventData = {
      campaign_id: 'campaign-123',
      recipients: [
        { external_user_id: 'user-123', send_to_existing_only: true },
        { external_user_id: 'user-456', send_to_existing_only: true }
      ],
      prioritization: {
        first_priority: 'identified',
        second_priority: 'most_recently_updated'
      }
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/campaigns/trigger/send', (body) => {
        // Check that the top-level prioritization is removed
        expect(body.prioritization).toBeUndefined()

        // Check that the prioritization array is applied to each recipient
        expect(body.recipients.length).toBe(2)
        expect(body.recipients[0].prioritization).toEqual(['identified', 'most_recently_updated'])
        expect(body.recipients[1].prioritization).toEqual(['identified', 'most_recently_updated'])

        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test to verify prioritization with only first_priority
  it('creates prioritization array with just first_priority', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with recipients and only first_priority
    const validEventData = {
      campaign_id: 'campaign-123',
      recipients: [{ external_user_id: 'user-123', send_to_existing_only: true }],
      prioritization: {
        first_priority: 'unidentified'
      }
    }

    // Mock the API request
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/campaigns/trigger/send', (body) => {
        // Check that the prioritization array contains only the first priority
        expect(body.recipients[0].prioritization).toEqual(['unidentified'])
        return true
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      properties: validEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: validEventData,
      settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
      auth: undefined
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(mockRequest.isDone()).toBe(true)
  })

  // Test error handling for Braze API errors
  it('handles Braze API errors and surfaces error message as IntegrationError', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create valid test data that will trigger an API error
    const eventData = {
      campaign_id: 'invalid-campaign-123',
      broadcast: true
    }

    // Mock the API request to return an error with a message
    const mockRequest = nock('https://rest.iad-01.braze.com')
      .post('/campaigns/trigger/send')
      .reply(400, { message: 'Campaign with id invalid-campaign-123 not found' })

    const event = createTestEvent({
      properties: eventData
    })

    // Check that the error is thrown
    try {
      await testDestination.testAction(actionSlug, {
        event: event,
        mapping: eventData,
        settings: { ...settingsData, endpoint: 'https://rest.iad-01.braze.com' },
        auth: undefined
      })
    } catch (error) {
      // The error should be an IntegrationError with the correct message and code
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toBe('Campaign with id invalid-campaign-123 not found')
      expect(error.code).toBe('BRAZE_API_ERROR')
    }

    expect(mockRequest.isDone()).toBe(true)
  })
})
