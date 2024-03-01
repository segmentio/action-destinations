import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const SCHEMATIC_API_KEY = 'test'

const identify_mapping = {
  user_keys: {
    email: 'example@example.com'
  },
  company_keys: {
    c_id: '1234'
  }
}

const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123',
  apiKey: SCHEMATIC_API_KEY
}

const settings = {
  instanceUrl: 'https://api.schematichq.com',
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
      api_key: SCHEMATIC_API_KEY,
      type: 'identify',
      sent_at: new Date().toISOString(),
      body: {
        keys: { id: '1234' },
        traits: {
          email: 'homer@simpsons.com',
          name: 'simpson',
          age: 42,
          source: 'facebook'
        },
        company: {
          keys: {
            c_id: '1234'
          }
        }
      }
    })

    const responses = await testDestination.testAction('identifyUser', {
      event,
      settings,
      auth,
      mapping: identify_mapping
    })

    expect(responses[0].status).toBe(200)
  })
})
