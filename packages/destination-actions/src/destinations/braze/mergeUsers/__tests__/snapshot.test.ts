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

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: {
        previousIdType: 'external_id',
        previousIdValue: 'user-to-merge',
        keepIdType: 'external_id',
        keepIdValue: 'user-to-keep'
      },
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
    const [, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    const event = createTestEvent({ type: 'alias' })

    const responses = await testDestination.testAction(actionSlug, {
      event,
      mapping: {
        previousIdType: 'email',
        previousIdValue: 'merge@example.com',
        previousIdPrioritization: 'identified,most_recently_updated',
        keepIdType: 'email',
        keepIdValue: 'keep@example.com',
        keepIdPrioritization: 'unidentified'
      },
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
  })
})
