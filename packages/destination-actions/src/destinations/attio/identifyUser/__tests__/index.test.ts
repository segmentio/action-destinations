import nock from 'nock'

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const email = 'gob@bluth.example'
const event = createTestEvent({
  type: 'identify' as const,
  userId: '9',
  traits: {
    name: 'George Oscar Bluth',
    email
  },
  receivedAt: '2024-05-24T10:00:00.000Z'
})

const mapping = {
  email_address: { '@path': '$.traits.email' },
  user_id: { '@path': '$.userId' },
  user_attributes: {
    name: {
      '@path': '$.traits.name'
    }
  },
  received_at: {
    '@path': '$.receivedAt'
  }
}

describe('Attio.identifyUser', () => {
  it('asserts a Person and then a User', async () => {
    nock('https://api.attio.com')
      .put('/v2/objects/people/records/simple?matching_attribute=email_addresses&append_to_existing_values=true', {
        data: {
          values: {
            email_addresses: email
          }
        }
      })
      .reply(200, {})

    nock('https://api.attio.com')
      .put('/v2/objects/users/records/simple?matching_attribute=user_id&append_to_existing_values=true', {
        data: {
          values: {
            user_id: '9',
            primary_email_address: email,
            person: email,
            name: 'George Oscar Bluth'
          }
        }
      })
      .reply(200, {})

    const responses = await testDestination.testAction('identifyUser', {
      event,
      mapping,
      settings: {}
    })

    expect(responses.length).toBe(2)
    expect(responses[0].status).toBe(200)
    expect(responses[1].status).toBe(200)
  })

  it('fails to assert a Person and returns', async () => {
    nock('https://api.attio.com')
      .put('/v2/objects/people/records/simple?matching_attribute=email_addresses&append_to_existing_values=true', {
        data: {
          values: {
            email_addresses: email
          }
        }
      })
      .reply(400, { error: 'Invalid matching attribute' })

    await expect(
      testDestination.testAction('identifyUser', {
        event,
        mapping,
        settings: {}
      })
    ).rejects.toThrowError()
  })

  it('uses the batch assertion endpoint', async () => {
    nock('https://api.attio.com')
      .put('/v2/batch/records', {
        assertions: [
          {
            object: 'users',
            mode: 'create-or-update',
            matching_attribute: 'user_id',
            multiselect_values: 'append',
            values: {
              primary_email_address: email,
              user_id: event.userId,
              name: event.traits?.name,

              person: {
                object: 'people',
                mode: 'create-or-update',
                matching_attribute: 'email_addresses',
                multiselect_values: 'append',
                values: {
                  email_addresses: email
                },
                received_at: '2024-05-24T10:00:00.000Z'
              }
            },
            received_at: '2024-05-24T10:00:00.000Z'
          }
        ]
      })
      .reply(202, '')

    const responses = await testDestination.testBatchAction('identifyUser', {
      events: [event],
      mapping,
      settings: {}
    })

    expect(responses.length).toBe(2)
    expect(responses[1].status).toBe(202)
  })

  it('handles the case where receivedAt is not provided', async () => {
    const lackingReceivedAtEvent = createTestEvent({
      type: 'identify' as const,
      userId: '9',
      traits: {
        name: 'George Oscar Bluth',
        email
      },
      receivedAt: undefined
    })

    // Can't control the exact timestamp, so only check it starts on the same year-month-day and is ISO8601 formatted
    const datePrefix = new Date().toISOString().split('T')[0]

    nock('https://api.attio.com')
      .put('/v2/batch/records', new RegExp(`"received_at":"${datePrefix}T`))
      .reply(202, '')

    await testDestination.testBatchAction('identifyUser', {
      events: [lackingReceivedAtEvent],
      mapping,
      settings: {}
    })
  })
})
