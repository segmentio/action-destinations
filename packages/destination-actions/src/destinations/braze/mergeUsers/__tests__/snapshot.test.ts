import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'mergeUsers'
const destinationSlug = 'Braze'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [, settingsData] = generateTestData(seedName, destination, action, true)

    // Provide custom event data with valid identifiers
    const customEventData = {
      identifier_to_merge: {
        external_id: 'user-to-merge'
      },
      identifier_to_keep: {
        external_id: 'user-to-keep'
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
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    // Customize the nested objects to include all identifier types
    const customEventData = {
      ...eventData,
      identifier_to_merge: {
        external_id: eventData.identifier_to_merge?.external_id || 'merge-external-id',
        braze_id: eventData.identifier_to_merge?.braze_id || 'merge-braze-id',
        email: eventData.identifier_to_merge?.email || 'merge@example.com',
        phone: eventData.identifier_to_merge?.phone || '+14155551234',
        user_alias: {
          alias_name: 'merge-alias',
          alias_label: 'segment'
        }
      },
      identifier_to_keep: {
        external_id: eventData.identifier_to_keep?.external_id || 'keep-external-id',
        braze_id: eventData.identifier_to_keep?.braze_id || 'keep-braze-id',
        email: eventData.identifier_to_keep?.email || 'keep@example.com',
        phone: eventData.identifier_to_keep?.phone || '+14155555678',
        user_alias: {
          alias_name: 'keep-alias',
          alias_label: 'segment'
        }
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
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }
  })
})
