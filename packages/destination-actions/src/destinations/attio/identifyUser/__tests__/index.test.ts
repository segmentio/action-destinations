import nock from 'nock'

import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const email = 'gob@bluth.example'
const event = createTestEvent({
  type: 'identify' as const,
  traits: {
    name: 'George Oscar Bluth',
    email
  }
})

const mapping = {
  email_address: { '@path': '$.traits.email' },
  user_attributes: {
    name: {
      '@path': '$.traits.name'
    }
  }
}

describe('Attio.identifyUser', () => {
  it('asserts a Person and then a User', async () => {
    nock('https://api.attio.com')
      .put('/v2/objects/people/records/simple?matching_attribute=email_addresses', {
        data: {
          values: {
            email_addresses: email
          }
        }
      })
      .reply(200, {})

    nock('https://api.attio.com')
      .put('/v2/objects/users/records/simple?matching_attribute=primary_email_address', {
        data: {
          values: {
            name: 'George Oscar Bluth',
            primary_email_address: email,
            person: email
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
      .put('/v2/objects/people/records/simple?matching_attribute=email_addresses', {
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
})
