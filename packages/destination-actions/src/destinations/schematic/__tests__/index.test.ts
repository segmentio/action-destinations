import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

const SCHEMATIC_API_KEY = 'test'

const ts = '2023-01-01T00:00:00.000Z'

const track_mapping = {
  event_name: 'test',
  timestamp: { '@path': '$.timestamp' }
}

const identify_mapping = {
  user_keys: { email: 'test@test.com' },
  company_keys: { org_id: '1234' },
  timestamp: { '@path': '$.timestamp' }
}

const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123',
  apiKey: SCHEMATIC_API_KEY
}

const settings = {
  instanceUrl: 'https://c.schematichq.com',
  apiKey: SCHEMATIC_API_KEY
}

describe('POST events', () => {
  it('should create an event', async () => {
    nock(`${settings.instanceUrl}`).post('/e').reply(200, {
      ok: true
    })

    const event = createTestEvent({
      type: 'track',
      timestamp: new Date(ts).toISOString(),
      event: 'Segment Test Event Name',
      properties: {
        email: 'silkpants@richer.com',
        last_name: 'silkpants'
      }
    })

    const responses = await testDestination.testAction('trackEvent', {
      event,
      settings,
      auth,
      mapping: track_mapping
    })

    console.log(responses[0].status)

    expect(responses[0].status).toBe(200)
  })

  it('should update a user', async () => {
    nock(`${settings.instanceUrl}`).post('/e').reply(200, {
      ok: true
    })

    const event = createTestEvent({
      type: 'identify',
      timestamp: new Date(ts).toISOString(),
      traits: {
        name: 'simpson',
        age: 42,
        source: 'facebook'
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings,
      auth,
      mapping: identify_mapping
    })

    console.log(responses[0].status)

    expect(responses[0].status).toBe(200)
  })
})
