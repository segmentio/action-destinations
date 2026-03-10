import { createTestIntegration } from '../create-test-integration'
import { resolveAudienceMembership } from '../audience-membership'
import { DestinationDefinition } from '../destination-kit'
import { ExecuteInput } from '../destination-kit/types'
import { JSONObject } from '../json-object'

// --- Unit tests for the helper ---

describe('resolveAudienceMembership', () => {
  it('returns undefined when rawData is undefined', () => {
    expect(resolveAudienceMembership(undefined)).toBeUndefined()
  })

  it('returns undefined when computation_class is not audience', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_class: 'computed_trait', computation_key: 'my_audience' } },
        properties: { my_audience: true }
      })
    ).toBeUndefined()
  })

  it('returns undefined when computation_class is missing', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_key: 'my_audience' } },
        properties: { my_audience: true }
      })
    ).toBeUndefined()
  })

  it('returns undefined when computation_key is missing', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_class: 'audience' } },
        properties: { my_audience: true }
      })
    ).toBeUndefined()
  })

  it('returns undefined when the membership value is not a boolean', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: { my_audience: 'true' }
      })
    ).toBeUndefined()
  })

  it('returns undefined when the computation_key is not present in properties', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: {}
      })
    ).toBeUndefined()
  })

  it('returns true when the user is being added to the audience', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: { my_audience: true }
      })
    ).toBe(true)
  })

  it('returns false when the user is being removed from the audience', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: { my_audience: false }
      })
    ).toBe(false)
  })

  it('returns undefined when context is missing', () => {
    expect(
      resolveAudienceMembership({
        properties: { my_audience: true }
      })
    ).toBeUndefined()
  })

  it('returns undefined when properties is missing', () => {
    expect(
      resolveAudienceMembership({
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } }
      })
    ).toBeUndefined()
  })
})

// --- Integration tests verifying audienceMembership is set on ExecuteInput ---

describe('audienceMembership on ExecuteInput in perform()', () => {
  it('is true when user is being added to an audience', async () => {
    let capturedData: ExecuteInput<JSONObject, JSONObject> | undefined

    const destination: DestinationDefinition<JSONObject> = {
      name: 'Test Destination',
      mode: 'cloud',
      authentication: { scheme: 'custom', fields: {} },
      actions: {
        testAction: {
          title: 'Test Action',
          description: 'Test',
          fields: {
            userId: { label: 'User ID', description: 'The user ID', type: 'string' }
          },
          perform: (_request, data) => {
            capturedData = data as ExecuteInput<JSONObject, JSONObject>
          }
        }
      }
    }

    const testDestination = createTestIntegration(destination)
    await testDestination.testAction('testAction', {
      mapping: { userId: { '@path': '$.userId' } },
      event: {
        type: 'identify',
        userId: 'user-1',
        context: {
          personas: { computation_class: 'audience', computation_key: 'my_audience' }
        },
        properties: { my_audience: true }
      }
    })

    expect(capturedData?.audienceMembership).toBe(true)
  })

  it('is false when user is being removed from an audience', async () => {
    let capturedData: ExecuteInput<JSONObject, JSONObject> | undefined

    const destination: DestinationDefinition<JSONObject> = {
      name: 'Test Destination',
      mode: 'cloud',
      authentication: { scheme: 'custom', fields: {} },
      actions: {
        testAction: {
          title: 'Test Action',
          description: 'Test',
          fields: {
            userId: { label: 'User ID', description: 'The user ID', type: 'string' }
          },
          perform: (_request, data) => {
            capturedData = data as ExecuteInput<JSONObject, JSONObject>
          }
        }
      }
    }

    const testDestination = createTestIntegration(destination)
    await testDestination.testAction('testAction', {
      mapping: { userId: { '@path': '$.userId' } },
      event: {
        type: 'identify',
        userId: 'user-1',
        context: {
          personas: { computation_class: 'audience', computation_key: 'my_audience' }
        },
        properties: { my_audience: false }
      }
    })

    expect(capturedData?.audienceMembership).toBe(false)
  })

  it('is undefined for non-audience events', async () => {
    let capturedData: ExecuteInput<JSONObject, JSONObject> | undefined

    const destination: DestinationDefinition<JSONObject> = {
      name: 'Test Destination',
      mode: 'cloud',
      authentication: { scheme: 'custom', fields: {} },
      actions: {
        testAction: {
          title: 'Test Action',
          description: 'Test',
          fields: {
            userId: { label: 'User ID', description: 'The user ID', type: 'string' }
          },
          perform: (_request, data) => {
            capturedData = data as ExecuteInput<JSONObject, JSONObject>
          }
        }
      }
    }

    const testDestination = createTestIntegration(destination)
    await testDestination.testAction('testAction', {
      mapping: { userId: { '@path': '$.userId' } },
      event: {
        type: 'track',
        userId: 'user-1',
        properties: { foo: 'bar' }
      }
    })

    expect(capturedData?.audienceMembership).toBeUndefined()
  })

  it('does not modify the payload object', async () => {
    let capturedData: ExecuteInput<JSONObject, JSONObject> | undefined

    const destination: DestinationDefinition<JSONObject> = {
      name: 'Test Destination',
      mode: 'cloud',
      authentication: { scheme: 'custom', fields: {} },
      actions: {
        testAction: {
          title: 'Test Action',
          description: 'Test',
          fields: {
            userId: { label: 'User ID', description: 'The user ID', type: 'string' }
          },
          perform: (_request, data) => {
            capturedData = data as ExecuteInput<JSONObject, JSONObject>
          }
        }
      }
    }

    const testDestination = createTestIntegration(destination)
    await testDestination.testAction('testAction', {
      mapping: { userId: { '@path': '$.userId' } },
      event: {
        type: 'identify',
        userId: 'user-1',
        context: {
          personas: { computation_class: 'audience', computation_key: 'my_audience' }
        },
        properties: { my_audience: true }
      }
    })

    expect(capturedData?.audienceMembership).toBe(true)
    expect(capturedData?.payload).not.toHaveProperty('audienceMembership')
  })
})
