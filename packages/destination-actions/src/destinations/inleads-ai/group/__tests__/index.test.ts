import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_KEY } from '../../__tests__/index.test'

const testDestination = createTestIntegration(Destination)

beforeAll(() => {
  nock.disableNetConnect()
})

afterAll(() => {
  nock.enableNetConnect()
  nock.cleanAll()
})

const inleadsGroupData = {
  account_id: {
    '@path': '$.groupId'
  },
  name: {
    '@if': {
      exists: { '@path': '$.traits.name' },
      then: { '@path': '$.traits.name' },
      else: { '@path': '$.properties.name' }
    }
  },
  created_at: {
    '@path': '$.traits.created_at'
  },
  traits: {
    '@path': '$.traits'
  },
  plan: {
    '@path': '$.traits.plan'
  },
  industry: {
    '@path': '$.traits.industry'
  },
  website: {
    '@path': '$.traits.website'
  }
}

describe('InleadsAI.group', () => {
  test('Should throw an error if `account_id or` `name` is not defined', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        email: 'test@company.com'
      },
      groupId: 'test@test.com'
    })

    await expect(
      testDestination.testAction('group', {
        event,
        mapping: inleadsGroupData
      })
    ).rejects.toThrowError()
  })

  test('Should throw an error if apiKey is not defined', async () => {
    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'test'
      },
      groupId: '123456'
    })

    await expect(
      testDestination.testAction('group', {
        event,
        mapping: inleadsGroupData,
        settings: {
          apiKey: API_KEY
        }
      })
    ).rejects.toThrowError()
  })

  test('Should send an group event to InleadsAI', async () => {
    // Mock: Segment group Call
    nock("https://server.inleads.ai")
      .post('/events/track', {
        apiKey: API_KEY
      })
      .reply(200, { success: true })

    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'test'
      },
      groupId: '123456'
    })

    const responses = await testDestination.testAction('group', {
      event,
      mapping: inleadsGroupData,
      settings: {
        apiKey: API_KEY
      }
    })

    expect(responses[0].status).toEqual(200)
  })
})
