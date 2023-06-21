import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'upsertCompany'
const destinationSlug = 'HubSpot'
const seedName = `${destinationSlug}#${actionSlug}`

// const contactId = '123456789'
const hubspotGeneratedCompanyID = '1000000000'

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)
    nock(/.*/).persist().patch(/.*/).reply(200, { id: hubspotGeneratedCompanyID })

    const event = createTestEvent({
      properties: eventData
    })

    const contactId = '123456789'
    const setTransaction = () => {}

    try {
      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: settingsData,
        auth: undefined,
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
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
    } catch (e) {
      expect(e).toMatchSnapshot()
    }
  })

  it('all fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, false)

    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)
    nock(/.*/).persist().patch(/.*/).reply(200, { id: hubspotGeneratedCompanyID })

    const event = createTestEvent({
      properties: eventData
    })

    const contactId = '123456789'
    const setTransaction = () => {}

    try {
      const responses = await testDestination.testAction(actionSlug, {
        event: event,
        mapping: event.properties,
        settings: settingsData,
        auth: undefined,
        transactionContext: {
          transaction: {
            contact_id: contactId
          },
          setTransaction
        }
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
    } catch (e) {
      expect(e).toMatchSnapshot()
    }
  })
})
