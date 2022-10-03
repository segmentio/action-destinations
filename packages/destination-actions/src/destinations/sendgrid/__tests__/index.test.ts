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

beforeEach(() => {
  nock(`${settings.instanceUrl}`)
    .get('/v3/marketing/field_definitions')
    .reply(200, {
      custom_fields: [
        {
          id: 'e1_N',
          name: 'Age',
          field_type: 'Number',
          _metadata: {
            self: 'https://api.sendgrid.com/v3/marketing/field_definitions/e1_N'
          }
        },
        {
          id: 'e2_N',
          name: 'Source',
          field_type: 'String',
          _metadata: {
            self: 'https://api.sendgrid.com/v3/marketing/field_definitions/e2_N'
          }
        }
      ]
    })
  nock(`${settings.instanceUrl}`).put('/v3/marketing/contacts').reply(202, {})
})

describe('Sendgrid.updateUserProfile', () => {
  it('should create a contact record', async () => {
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
        primary_email: {
          '@path': '$.properties.email'
        },
        last_name: {
          '@path': '$.properties.last_name'
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[1].status).toBe(202)
  })

  it('should create two contact record', async () => {
    const event1 = createTestEvent({
      type: 'track',
      event: 'Segment Test Event 1',
      properties: {
        enable_batching: true,
        email: 'silkpants1@richer.com',
        last_name: 'SilkPants 1'
      }
    })

    const event2 = createTestEvent({
      type: 'track',
      event: 'Segment Test Event 2',
      properties: {
        enable_batching: true,
        email: 'silkpants2@richer.com',
        last_name: 'SilkPants 2'
      }
    })

    const events = [event1, event2]
    const responses = await testDestination.testBatchAction('updateUserProfile', {
      events,
      settings,
      auth,
      mapping: {
        primary_email: {
          '@path': '$.properties.email'
        },
        last_name: {
          '@path': '$.properties.last_name'
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[1].status).toBe(202)
  })

  it('should substitute custom field names for their corresponding IDs', async () => {
    const event = createTestEvent({
      type: 'identify',
      event: 'Segment Test Event Name',
      traits: {
        email: 'homer@simpsons.com',
        last_name: 'simpson',
        age: 42,
        source: 'facebook'
      }
    })

    const responses = await testDestination.testAction('updateUserProfile', {
      event,
      settings,
      auth,
      mapping: {
        primary_email: { '@path': '$.traits.email' },
        customFields: {
          aGE: { '@path': '$.traits.age' },
          e2_N: { '@path': '$.traits.source' }
        }
      }
    })

    expect(responses.length).toBe(2)
    expect(responses[1].status).toBe(202)
    expect(responses[1].options.body).toEqual(
      '{"contacts":[{"email":"homer@simpsons.com","custom_fields":{"e1_N":42,"e2_N":"facebook"}}]}'
    )
  })
})
