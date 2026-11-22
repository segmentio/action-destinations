import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import { API_BASE } from '../constants'
import { generateTestData } from '../../../lib/test-data'

const testDestination = createTestIntegration(destination)
const destinationSlug = 'actions-gaintrace'

afterEach(() => {
  nock.cleanAll()
})

function mockApi() {
  nock(API_BASE).persist().get(/.*/).reply(200, {})
  nock(API_BASE).persist().post(/.*/).reply(200, {})
}

async function snapshotAction(actionSlug: string, requiredOnly: boolean) {
  const seedName = `${destinationSlug}#${actionSlug}`
  const action = destination.actions[actionSlug]
  const [eventData, settingsData] = generateTestData(seedName, destination, action, requiredOnly)

  mockApi()

  const event = createTestEvent({ properties: eventData })

  const mapping: Record<string, unknown> = { ...(event.properties as Record<string, unknown>) }
  if ('userId' in action.fields && mapping.userId == null && mapping.anonymousId == null) {
    mapping.userId = 'snapshot-user-id'
  }

  const responses = await testDestination.testAction(actionSlug, {
    event,
    mapping,
    settings: settingsData,
    auth: undefined
  })

  const request = responses[0].request
  const rawBody = await request.text()

  try {
    expect(JSON.parse(rawBody)).toMatchSnapshot()
  } catch (err) {
    expect(rawBody).toMatchSnapshot()
  }

  expect(request.headers).toMatchSnapshot()
}

describe(`Testing snapshot for ${destinationSlug} destination:`, () => {
  for (const actionSlug in destination.actions) {
    it(`${actionSlug} action - required fields`, async () => {
      await snapshotAction(actionSlug, true)
    })

    it(`${actionSlug} action - all fields`, async () => {
      await snapshotAction(actionSlug, false)
    })
  }
})
