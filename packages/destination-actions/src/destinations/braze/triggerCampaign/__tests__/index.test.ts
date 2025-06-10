import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'triggerCampaign'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Unit tests for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
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

  // Test error case: multiple targeting parameters provided
  it('throws error when multiple targeting parameters are provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create test data with multiple targeting parameters
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
    ).rejects.toThrowError('Only one of "recipients", "broadcast" or "audience" should be provided.')
  })

  // Test error case when no targeting parameter is provided, all null
  it('throws error when no targeting parameter is provided', async () => {
    const action = destination.actions[actionSlug]
    const [_, settingsData] = generateTestData(seedName, destination, action, false)

    // Create invalid test data with no targeting params
    const invalidEventData = {
      campaign_id: 'campaign-123',
      // Remove all targeting parameters
      broadcast: null,
      recipients: null,
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
    ).rejects.toThrowError(
      `The root value is missing the required field 'broadcast'. The root value must match "then" schema. The root value is missing the required field 'recipients'. The root value must match "then" schema. The root value is missing the required field 'audience'. The root value must match "then" schema.`
    )
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
})
