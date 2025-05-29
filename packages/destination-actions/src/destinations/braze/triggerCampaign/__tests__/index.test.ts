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
      recipients: [{ external_user_id: 'user-123' }],
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
})
