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
  first_name: {
    '@if': {
      exists: { '@path': '$.traits.first_name' },
      then: { '@path': '$.traits.first_name' },
      else: { '@path': '$.properties.first_name' }
    }
  },
  last_name: {
    '@if': {
      exists: { '@path': '$.traits.last_name' },
      then: { '@path': '$.traits.last_name' },
      else: { '@path': '$.properties.last_name' }
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
  test('Should throw an error if `user_id` is not defined', async () => {
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
        mapping: heIdentifyMapping,
        settings: {
          workspaceIdentifier: 'identifier',
          apiKey: 'apiKey'
        }
      })
    ).rejects.toThrowError()
  })

  test('Should throw an error if both `name` and `first_name` & `last_name` are not defined', async () => {
    const event = createTestEvent({
      type: 'identify',
      traits: {
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
          workspaceIdentifier: 'identifier',
          apiKey: 'apiKey'
        }
      })
    ).rejects.toThrowError()
  })

  test('Should not throw error if name is defined and first and last name are not', async () => {
    nock('https://events.hyperengage.io').post('/api/v1/s2s/event?token=apiKey').reply(200, { success: true })
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
          workspaceIdentifier: 'identifier',
          apiKey: 'apiKey'
        }
      })
    ).resolves.not.toThrowError()
  })

  test('Should not throw error if first_name and last_name are defined and name is not', async () => {
    nock('https://events.hyperengage.io').post('/api/v1/s2s/event?token=apiKey').reply(200, { success: true })
    const event = createTestEvent({
      type: 'identify',
      traits: {
        first_name: 'test',
        last_name: 'test',
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
          workspaceIdentifier: 'identifier',
          apiKey: 'apiKey'
        }
      })
    ).resolves.not.toThrowError()
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
    nock('https://events.hyperengage.io').post('/api/v1/s2s/event?token=apiKey').reply(200, { success: true })

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

    expect(responses[0].status).toEqual(200)
  })
})
