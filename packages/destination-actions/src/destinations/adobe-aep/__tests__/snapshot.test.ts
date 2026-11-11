import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../lib/test-data'
import destination from '../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-adobe-aep'
const auth = { accessToken: 'snapshot-token', refreshToken: '' }

// generateTestData produces random strings, which fail timestamp parsing and can produce
// conflicting XDM paths, so these fields are pinned.
const pinned = {
  timestamp: '2026-01-15T12:34:56.000Z',
  xdmMapping: { 'web.webPageDetails.URL': 'https://example.com/snapshot' }
}

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  afterEach(() => nock.cleanAll())

  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

      nock(/.*/)
        .persist()
        .post(/.*/)
        .reply(207, { responses: [{ xactionId: 'x1' }] })

      const event = createTestEvent({
        properties: { ...eventData, ...pinned, ecid: 'snapshot-ecid' }
      })
      const responses = await testDestination.testAction(actionSlug, {
        event,
        mapping: event.properties,
        settings: settingsData,
        auth
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

    it(`${actionSlug} action - all fields`, async () => {
      const seedName = `${destinationSlug}#${actionSlug}`
      const action = destination.actions[actionSlug]
      const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

      nock(/.*/)
        .persist()
        .post(/.*/)
        .reply(207, { responses: [{ xactionId: 'x1' }] })

      const event = createTestEvent({ properties: { ...eventData, ...pinned } })
      const responses = await testDestination.testAction(actionSlug, {
        event,
        mapping: event.properties,
        settings: settingsData,
        auth
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
  }
})
