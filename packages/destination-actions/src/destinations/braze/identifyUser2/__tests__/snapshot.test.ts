import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'identifyUser2'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination V2 action:`, () => {
  it('fails if sync mode is delete', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    // Add emails_to_identify and prioritization fields
    const customEventData = {
      ...eventData,
      email_to_identify: 'test1@example.com',
      prioritization: {
        first_priority: 'most_recently_updated'
      }
    }

    const event = createTestEvent({
      properties: customEventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: { ...customEventData, __segment_internal_sync_mode: 'delete' },
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError('syncMode must be "add" or "upsert"')
  })

  it('fails if sync mode is update', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    // Add emails_to_identify and prioritization fields
    const customEventData = {
      ...eventData,
      email_to_identify: 'test1@example.com',
      prioritization: {
        first_priority: 'most_recently_updated'
      }
    }

    const event = createTestEvent({
      properties: customEventData
    })

    await expect(
      testDestination.testAction(actionSlug, {
        event: event,
        mapping: { ...customEventData, __segment_internal_sync_mode: 'update' },
        settings: settingsData,
        auth: undefined
      })
    ).rejects.toThrowError('syncMode must be "add" or "upsert"')
  })

  it('snapshot with all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    // Add emails_to_identify and prioritization fields
    const customEventData = {
      ...eventData,
      email_to_identify: 'test1@example.com',
      prioritization: {
        first_priority: 'least_recently_updated',
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
      mapping: { ...customEventData, __segment_internal_sync_mode: 'add' },
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

  it('snapshot with email_to_identify field only', async () => {
    const action = destination.actions[actionSlug]
    const [, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    // Use only email_to_identify fields (no user_alias)
    const customEventData = {
      external_id: 'test-user-1',
      email_to_identify: 'test1@example.com',
      prioritization: {
        first_priority: 'least_recently_updated',
        second_priority: 'most_recently_updated'
      },
      merge_behavior: 'merge'
    }

    const event = createTestEvent({
      properties: customEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: { ...customEventData, __segment_internal_sync_mode: 'add' },
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

  it('snapshot with both user_alias and email_to_identify fields', async () => {
    const action = destination.actions[actionSlug]
    const [, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    // Use both user_alias and email_to_identify to match earlier event data format
    const customEventData = {
      external_id: 'test-user-4',
      user_alias: {
        alias_name: 'legacy-alias-name',
        alias_label: 'legacy-alias-label'
      },
      email_to_identify: 'test4@example.com',
      prioritization: {
        first_priority: 'most_recently_updated',
        second_priority: 'unidentified'
      },
      merge_behavior: 'merge'
    }

    const event = createTestEvent({
      properties: customEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: { ...customEventData, __segment_internal_sync_mode: 'add' },
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

  it('snapshot with minimal user_alias field only', async () => {
    const action = destination.actions[actionSlug]
    const [, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    // Minimal user_alias only without merge_behavior
    const customEventData = {
      external_id: 'test-user-7',
      user_alias: {
        alias_name: 'minimal-alias',
        alias_label: 'minimal-label'
      }
    }

    const event = createTestEvent({
      properties: customEventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: { ...customEventData, __segment_internal_sync_mode: 'upsert' },
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
