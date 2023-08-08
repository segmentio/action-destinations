import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import destination from '../../index'
import { generateTestData } from '../../../../lib/test-data'
import * as fs from 'fs'

const actionSlug = 'registerAndAssociate'
const destinationSlug = 'Airship'
const seedName = `${destinationSlug}#${actionSlug}`

const testDestination = createTestIntegration(Destination)

describe(`Testing ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    let [test_data, settingsData] = generateTestData(seedName, destination, action, true)
    test_data = fs.readFileSync('src/destinations/airship/registerAndAssociate/__tests__/test_data.json', 'utf-8')
    settingsData.endpoint = 'https://go.airship.com'
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)
    const event = createTestEvent({
      properties: JSON.parse(test_data)
    })
    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: event.properties,
      settings: settingsData,
      auth: undefined
    })
    const request = responses[0].request
    const rawBody = await request.text()
    console.log(rawBody)
    console.log(createTestIntegration)

    // try {
    //   const json = JSON.parse(rawBody)
    //   expect(json).toMatchSnapshot()
    //   return
    // } catch (err) {
    //   expect(rawBody).toMatchSnapshot()
    // }

    // expect(request.headers).toMatchSnapshot()
  })
})
