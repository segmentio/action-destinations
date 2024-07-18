import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'streamConversion'
const destinationSlug = 'LinkedinConversions'
const seedName = `${destinationSlug}#${actionSlug}`
const action = destination.actions[actionSlug]
const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    eventData.email = 'nick@twilio.com'
    eventData.timestamp = 'NaN'

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: {
        email: { '@path': '$.properties.email' },
        conversionHappenedAt: { '@path': '$.properties.timestamp' },
        onMappingSave: {
          inputs: {},
          outputs: {
            id: '1234'
          }
        }
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
    nock(/.*/).persist().get(/.*/).reply(200)
    nock(/.*/).persist().post(/.*/).reply(200)
    nock(/.*/).persist().put(/.*/).reply(200)

    eventData.email = 'nick@twilio.com'
    eventData.timestamp = 'NaN'
    eventData.first_name = 'mike'
    eventData.last_name = 'smith'
    eventData.title = 'software engineer'
    eventData.companyName = 'microsoft'
    eventData.countryCode = 'US'
    eventData.value = 100

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: {
        email: { '@path': '$.properties.email' },
        conversionHappenedAt: { '@path': '$.properties.timestamp' },
        conversionValue: {
          currencyCode: 'USD',
          amount: { '@path': '$.properties.value' }
        },
        userInfo: {
          firstName: { '@path': '$.properties.first_name' },
          lastName: { '@path': '$.properties.last_name' },
          title: { '@path': '$.properties.title' },
          companyName: { '@path': '$.properties.companyName' },
          countryCode: { '@path': '$.properties.countryCode' }
        },
        onMappingSave: {
          inputs: {},
          outputs: {
            id: '1234'
          }
        }
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
  })
})
