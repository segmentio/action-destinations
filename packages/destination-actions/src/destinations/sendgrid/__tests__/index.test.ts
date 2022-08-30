import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination)

const settings = {
  instanceUrl: 'https://api.sendgrid.com',
  sendGridApiKey: 'test'
}

const auth = {
  refreshToken: 'xyz321',
  accessToken: 'abc123',
  sendGridApiKey: 'test'
}

describe('Sendgrid.updateUserProfile', () => {
  it('should create a contact record', async () => {
    nock(`${settings.instanceUrl}`).put('/v3/marketing/contacts').reply(202, {})

    const event = createTestEvent({
      type: 'track',
      event: 'Segment Test Event Name',
      properties: {
        email: 'silkpants@richer.com',
        last_name: 'silkpants'
      }
    })

    const responses = await testDestination.testAction('updateUserProfile', {
      event,
      settings,
      auth,
      mapping: {
        email: {
          '@path': '$.properties.email'
        },
        last_name: {
          '@path': '$.properties.last_name'
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(202)
  })
})
