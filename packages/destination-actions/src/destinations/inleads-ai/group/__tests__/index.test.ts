import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { API_KEY } from '../../__tests__/index.test'
import { IntegrationBaseUrl } from '../../contants'

const testDestination = createTestIntegration(Destination)

afterAll(() => {
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
  utc_time: {
    '@path': '$.timestamp'
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

    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'test'
      },
      groupId: '123456'
    })

    // Mock: Segment group Call
    nock(`${IntegrationBaseUrl}`)
      .post('/events/track', {
        account_id: event.groupId,
        name: event.traits?.name,
        traits: {
          name: event.traits?.name
        },
        apiKey: API_KEY,
        utc_time: event.timestamp?.toString(),
      })
      .reply(200, { success: true })

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
