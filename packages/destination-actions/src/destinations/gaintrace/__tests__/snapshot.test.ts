import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import destination from '../index'
import { API_BASE } from '../api'
import { generateTestData } from '../../../lib/test-data'

const testDestination = createTestIntegration(destination)
// The catalog slug, not the display name, so seeded data stays stable and
// matches the destination's identity.
const destinationSlug = 'actions-gaintrace'

// nock is scoped to the GainTrace host rather than a catch-all, and cleaned up
// after every test, so a persisted interceptor cannot leak into another suite or
// silently swallow an unexpected outbound call.
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

  // userId and anonymousId are individually optional, but the event actions
  // require at least ONE of them: an event with neither cannot be attributed to
  // a person or a company, and sending it would inflate usage counts while
  // teaching the customer nothing. In "required fields" mode the generator
  // supplies neither, so seed one here rather than weakening the rule.
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

  // Deliberately outside the try/catch and after both branches: the widely
  // copied version of this template returns early on the JSON path, so headers
  // are never actually snapshotted.
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
