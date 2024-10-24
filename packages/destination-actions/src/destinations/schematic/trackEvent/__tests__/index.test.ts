import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const SCHEMATIC_API_KEY = 'test'

const mapping = {
  event_name: 'test',
  timestamp: { '@path': '$.timestamp' }
}

const ts = '2023-01-01T00:00:00.000Z'

const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123',
  apiKey: SCHEMATIC_API_KEY
}

const settings = {
  instanceUrl: 'https://c.schematichq.com',
  apiKey: SCHEMATIC_API_KEY
}

describe('POST track event', () => {
  beforeEach(() => {
    nock(`${settings.instanceUrl}`).post('/e').reply(200, {
      ok: true
    })
  })

  it('should create an event', async () => {
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
      mapping
    })

    expect(responses[0].status).toBe(200)
  })
})
