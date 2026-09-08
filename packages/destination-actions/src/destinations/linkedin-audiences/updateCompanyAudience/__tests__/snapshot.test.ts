import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { generateTestData } from '../../../../lib/test-data'
import destination from '../../index'
import nock from 'nock'

const testDestination = createTestIntegration(destination)
const actionSlug = 'updateCompanyAudience'
const destinationSlug = 'LinkedinAudiences'
const seedName = `${destinationSlug}#${actionSlug}`

describe(`Testing snapshot for ${destinationSlug}'s ${actionSlug} destination action:`, () => {
  it('required fields', async () => {
    const action = destination.actions[actionSlug]
    const [eventData, settingsData] = generateTestData(seedName, destination, action, true)

    nock(/.*/)
      .persist()
      .get(/.*/)
      .reply(200, { elements: [{ id: 'dmp_segment_id', name: 'Company Audience', type: 'COMPANY' }] })
    nock(/.*/)
      .persist()
      .post(/.*/)
      .reply(200, { elements: [{ status: 201 }] })

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      // At least one identifier value is required; the auto-generated data leaves them empty.
      // computation_key is the (hidden) lookup key and is likewise supplied here so perform can resolve the segment.
      mapping: { ...event.properties, identifiers: { companyDomain: 'microsoft.com' }, computation_key: 'aud_key' },
      settings: settingsData,
      auth: undefined
    })

    // The first response is the segment lookup GET; the companies batch POST is the last one.
    const request = responses[responses.length - 1].request
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

    nock(/.*/)
      .persist()
      .get(/.*/)
      .reply(200, { elements: [{ id: 'dmp_segment_id', name: 'Company Audience', type: 'COMPANY' }] })
    nock(/.*/)
      .persist()
      .post(/.*/)
      .reply(200, { elements: [{ status: 201 }] })

    const event = createTestEvent({
      properties: eventData
    })

    const responses = await testDestination.testAction(actionSlug, {
      event: event,
      mapping: { ...event.properties },
      settings: settingsData,
      auth: undefined
    })

    // The first response is the segment lookup GET; the companies batch POST is the last one.
    const request = responses[responses.length - 1].request
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
