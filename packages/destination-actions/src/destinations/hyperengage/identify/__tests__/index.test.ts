import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

beforeEach(() => nock.cleanAll())

const heIdentifyMapping = {
  user_id: {
    '@path': '$.userId'
  },
  name: {
    '@if': {
      exists: { '@path': '$.traits.name' },
      then: { '@path': '$.traits.name' },
      else: { '@path': '$.properties.name' }
    }
  },
  email: {
    '@if': {
      exists: { '@path': '$.traits.email' },
      then: { '@path': '$.traits.email' },
      else: { '@path': '$.properties.email' }
    }
  },
  created_at: {
    '@path': '$.traits.created_at'
  },
  traits: {
    '@path': '$.traits'
  }
}

describe('Hyperengage.identify', () => {
  test('Should throw an error if `user_id or` `name` is not defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'test',
        email: 'test@company.com'
      },
      properties: {
        timezone: 'America/New_York'
      }
    })

    await expect(
      testDestination.testAction('identify', {
        event,
        mapping: heIdentifyMapping
      })
    ).rejects.toThrowError()
  })

  test('Should throw an error if workspaceIdentifier or apiKey is not defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'test',
        email: 'test@company.com'
      },
      properties: {
        timezone: 'America/New_York'
      },
      userId: '123456'
    })

    await expect(
      testDestination.testAction('identify', {
        event,
        mapping: heIdentifyMapping,
        settings: {
          workspaceIdentifier: '',
          apiKey: ''
        }
      })
    ).rejects.toThrowError()
  })

  test('Should send an identify event to Hyperengage', async () => {
    // Mock: Segment Identify Call
    nock('https://t.jitsu.com').post('/api/v1/s2s/event?token=apiKey').reply(200, { success: true })

    const event = createTestEvent({
      type: 'identify',
      traits: {
        name: 'test',
        email: 'test@company.com'
      },
      properties: {
        timezone: 'America/New_York'
      },
      userId: '123456'
    })

    const responses = await testDestination.testAction('identify', {
      event,
      mapping: heIdentifyMapping,
      useDefaultMappings: true,
      settings: {
        workspaceIdentifier: 'identifier',
        apiKey: 'apiKey'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toEqual(200)
  })
})
