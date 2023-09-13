import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../../index'
import { generateTestData } from '../../../../lib/test-data'

const testDestination = createTestIntegration(destination)

const actionSlug = 'registerAndAssociate'
const destinationSlug = 'Airship'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)
    settingsData.endpoint = 'https://go.airship.com'

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/)
      .persist()
      .post('/api/channels/email')
      .reply(200, { ok: true, channel_id: '6be90795-a7d7-4657-b959-6a5afc199b06' })
    nock(/.*/).persist().post('/api/named_users/associate').reply(200, { ok: true })
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
      return
    } catch (err) {
      expect(rawBody).toMatchSnapshot()
    }

    expect(request.headers).toMatchSnapshot()
  })
})
