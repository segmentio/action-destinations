import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const SCHEMATIC_API_KEY = 'test'

const mapping = {
  user_keys: { email: 'test@test.com' },
  company_keys: { org_id: '1234' },
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

describe('POST identify call', () => {
  beforeEach(() => {
    nock(`${settings.instanceUrl}`).post('/e').reply(200, {
      ok: true
    })
  })

  it('should update a user', async () => {
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
      mapping
    })

    expect(responses[0].status).toBe(200)
  })
})
