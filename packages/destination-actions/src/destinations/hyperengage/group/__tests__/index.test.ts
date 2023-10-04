import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

beforeAll(() => {
  nock.disableNetConnect()
})

afterAll(() => {
  nock.enableNetConnect()
  nock.cleanAll()
})

const heGroupMapping = {
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

describe('Hyperengage.group', () => {
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
        mapping: heGroupMapping
      })
    ).rejects.toThrowError()
  })

  test('Should throw an error if workspaceIdentifier or apiKey is not defined', async () => {
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
        mapping: heGroupMapping,
        settings: {
          workspaceIdentifier: '',
          apiKey: ''
        }
      })
    ).rejects.toThrowError()
  })

  test('Should send an group event to Hyperengage', async () => {
    // Mock: Segment group Call
    nock('https://events.hyperengage.io').post('/api/v1/s2s/event?token=apiKey').reply(200, { success: true })

    const event = createTestEvent({
      type: 'group',
      traits: {
        name: 'test'
      },
      groupId: '123456'
    })

    const responses = await testDestination.testAction('group', {
      event,
      mapping: heGroupMapping,
      settings: {
        workspaceIdentifier: 'identifier',
        apiKey: 'apiKey'
      }
    })

    expect(responses[0].status).toEqual(200)
  })
})
