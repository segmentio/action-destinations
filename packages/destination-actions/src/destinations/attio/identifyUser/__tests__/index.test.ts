import nock from 'nock'

import Destination from '../../index'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

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
      .put('/v2/objects/people/records/simple?matching_attribute=email_addresses')
      .reply(200, {})

    nock('https://api.attio.com')
      .put('/v2/objects/users/records/simple?matching_attribute=email_address')
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

  it('fails to assert a Person but still asserts a User anyway', async () => {
    nock('https://api.attio.com')
      .put('/v2/objects/people/records/simple?matching_attribute=email_addresses', {
        data: {
          values: {
            email_addresses: email
          }
        }
      })
      .reply(400, { error: 'Invalid matching attribute' })

    nock('https://api.attio.com')
      .put('/v2/objects/users/records/simple?matching_attribute=email_address', {
        data: {
          values: {
            name: 'George Oscar Bluth',
            email_address: email
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
    expect(responses[0].status).toBe(400)
    expect(responses[1].status).toBe(200)
  })

  it('passes additional user & person attributes to assertion', async () => {
    const personAssertion = nock('https://api.attio.com')
      .put('/v2/objects/people/records/simple?matching_attribute=email_addresses', {
        data: {
          values: {
            email_addresses: email,
            linkedin: 'https://www.linkedin.com/in/george-oscar-bluth-123456789/'
          }
        }
      })
      .reply(400, { error: 'Invalid matching attribute' })

    const userAssertion = nock('https://api.attio.com')
      .put('/v2/objects/users/records/simple?matching_attribute=email_address', {
        data: {
          values: {
            name: 'George Oscar Bluth',
            email_address: email,
            age: 42
          }
        }
      })
      .reply(200, {})

    await testDestination.testAction('identifyUser', {
      event: {
        type: 'identify',
        traits: {
          name: 'George Oscar Bluth',
          email,
          age: 42,
          linkedin: 'https://www.linkedin.com/in/george-oscar-bluth-123456789/'
        }
      },
      mapping: {
        email_address: { '@path': '$.traits.email' },
        person_attributes: {
          linkedin: {
            '@path': '$.traits.linkedin'
          }
        },
        user_attributes: {
          name: {
            '@path': '$.traits.name'
          },
          age: {
            '@path': '$.traits.age'
          }
        }
      },
      settings: {}
    })

    expect(personAssertion.isDone())
    expect(userAssertion.isDone())
  })
})
