import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

const defaultMapping = {
  full_name: {
    '@path': '$.traits.name'
  },
  email: {
    '@path': '$.traits.email'
  },
  mobile: {
    '@path': '$.traits.mobile'
  }
}
const endpoint = 'https://api.surveysparrow.com'

describe('Surveysparrow.createContact', () => {
  it('should create contacts with valid payload', async () => {
    nock(endpoint).post('/v3/contacts').reply(200, { success: true })

    const event = createTestEvent({
      traits: {
        name: 'contact_1',
        email: 'contact_45@email.com'
      }
    })

    const responses = await testDestination.testAction('createContact', {
      event,
      mapping: defaultMapping,
      settings: {
        apiToken: 'test-source-write-key'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
  })

  it('should throw errors when creating a contact', async () => {
    nock(endpoint).post('/v3/contacts').reply(400, { success: false })

    const event = createTestEvent({
      traits: {
        name: 'contact_1',
        email: {
          email: 'ndejfk@jisf.com'
        }
      }
    })

    await testDestination
      .testAction('createContact', {
        event,
        mapping: defaultMapping,
        settings: {
          apiToken: 'test-source-write-key'
        }
      })
      .catch((error) => {
        expect(error.message).toEqual('Email must be a string but it was an object.')
      })
  })
})
