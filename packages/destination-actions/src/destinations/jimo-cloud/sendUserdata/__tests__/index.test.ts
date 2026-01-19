import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const settings: Settings = {
  apiKey: 'test-api-key'
}

describe('JimoCloudActions.sendUserdata', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should send user data with only userId (required field)', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: 'user123'
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123'
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      mapping: {
        userId: 'user123'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })

  it('should send user data with userId and email', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: 'user123',
        email: 'test@example.com'
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })

  it('should send user data with userId, email, and traits', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: 'user123',
        email: 'test@example.com',
        traits: {
          name: 'John Doe',
          plan: 'premium',
          company: 'Acme Inc'
        }
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com',
        name: 'John Doe',
        plan: 'premium',
        company: 'Acme Inc'
      }
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })

  it('should send user data with traits but without email', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: 'user123',
        traits: {
          name: 'John Doe',
          age: 30
        }
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        name: 'John Doe',
        age: 30
      }
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      mapping: {
        userId: 'user123',
        traits: {
          name: 'John Doe',
          age: 30
        }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })

  it('should not include email or traits if they are not provided', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: 'user123'
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123'
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      mapping: {
        userId: 'user123',
        email: null,
        traits: {}
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })

  it('should handle null userId gracefully', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: null,
        email: 'test@example.com'
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      traits: {
        email: 'test@example.com'
      }
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      mapping: {
        userId: null,
        email: 'test@example.com'
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })

  it('should properly format request with custom mapped fields', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: 'custom-user-id',
        email: 'custom@example.com',
        traits: {
          customField: 'customValue'
        }
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      properties: {
        id: 'custom-user-id',
        userEmail: 'custom@example.com',
        metadata: {
          customField: 'customValue'
        }
      }
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      mapping: {
        userId: { '@path': '$.properties.id' },
        email: { '@path': '$.properties.userEmail' },
        traits: { '@path': '$.properties.metadata' }
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })

  it('should use default mappings correctly', async () => {
    nock('https://api.jimo.ai')
      .post('/v1/segment/user', {
        userId: 'user123',
        email: 'test@example.com',
        traits: {
          name: 'John Doe',
          plan: 'premium'
        }
      })
      .matchHeader('Authorization', 'test-api-key')
      .reply(200, {})

    const event = createTestEvent({
      type: 'identify',
      userId: 'user123',
      traits: {
        email: 'test@example.com',
        name: 'John Doe',
        plan: 'premium'
      }
    })

    const responses = await testDestination.testAction('sendUserdata', {
      event,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(nock.isDone()).toBe(true)
  })
})
