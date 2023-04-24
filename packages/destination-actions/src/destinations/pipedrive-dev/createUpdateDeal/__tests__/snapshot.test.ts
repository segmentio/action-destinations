import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'createUpdateDeal'
const destinationSlug = 'Pipedrive (Dev)'
const seedName = `${destinationSlug}#${actionSlug}`
const PIPEDRIVE_DOMAIN = 'https://companydomain.pipedrive.com'
const auth = { accessToken: 'fake-access-token', refreshToken: 'fake-refresh-token' }

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    settingsData.domain = PIPEDRIVE_DOMAIN
    nock(PIPEDRIVE_DOMAIN)
      .persist()
      .get(/.*/)
      .query((q) => {
        return q.field_type === 'organizationField' && q.term === '42'
      })
      .twice()
      .reply(200, {
        data: [{ id: 42 }]
      })
    nock(PIPEDRIVE_DOMAIN).persist().post(/.*/).reply(200)

    eventData['organization_match_value'] = 42
    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
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

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)
    settingsData.domain = PIPEDRIVE_DOMAIN
    nock(PIPEDRIVE_DOMAIN)
      .persist()
      .get(/.*/)
      .twice()
      .reply(200, {
        data: [{ id: 42 }]
      })
    nock(PIPEDRIVE_DOMAIN).persist().put(/.*/).reply(200)

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
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
})
