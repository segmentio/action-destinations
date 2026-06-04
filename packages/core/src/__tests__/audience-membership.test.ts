import { createTestIntegration } from '../create-test-integration'
import { Destination } from '../destination-kit'
import { engageAudienceMembership, retlAudienceMembership } from '../audience-membership'
import { DestinationDefinition } from '../destination-kit'
import { ExecuteInput } from '../destination-kit/types'
import { JSONObject } from '../json-object'
import { createTestEvent } from '../create-test-event'

describe('engageAudienceMembership', () => {
  describe('identify events', () => {
    it('returns true when type is identify and traits[computation_key] is true', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: { my_audience: true }
        })
      ).toBe(true)
    })

    it('returns false when type is identify and traits[computation_key] is false', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: { my_audience: false }
        })
      ).toBe(false)
    })

    it('returns undefined when type is identify but computation_class is missing', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_key: 'my_audience' } },
          traits: { my_audience: true }
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is identify but computation_class is not audience or journey_step', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'computed_trait', computation_key: 'my_audience' } },
          traits: { my_audience: true }
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is identify but computation_key is missing', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'audience' } },
          traits: { my_audience: true }
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is identify but traits[computation_key] is absent', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: {}
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is identify but traits[computation_key] is not a boolean', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: { my_audience: 'true' }
        })
      ).toBeUndefined()
    })
  })

  describe('track events', () => {
    it('returns true when type is track and properties[computation_key] is true', () => {
      expect(
        engageAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: true }
        })
      ).toBe(true)
    })

    it('returns false when type is track and properties[computation_key] is false', () => {
      expect(
        engageAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: false }
        })
      ).toBe(false)
    })

    it('returns undefined when type is track but computation_class is missing', () => {
      expect(
        engageAudienceMembership({
          type: 'track',
          context: { personas: { computation_key: 'my_audience' } },
          properties: { my_audience: true }
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is track but computation_class is not audience or journey_step', () => {
      expect(
        engageAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'computed_trait', computation_key: 'my_audience' } },
          properties: { my_audience: true }
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is track but computation_key is missing', () => {
      expect(
        engageAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'audience' } },
          properties: { my_audience: true }
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is track but properties[computation_key] is absent', () => {
      expect(
        engageAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: {}
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is track but properties[computation_key] is not a boolean', () => {
      expect(
        engageAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: 'true' }
        })
      ).toBeUndefined()
    })
  })

  describe('other', () => {
    it('returns true when computation_class is journey_step (identify)', () => {
      expect(
        engageAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          traits: { my_step: true }
        })
      ).toBe(true)
    })

    it('returns undefined when rawData is undefined', () => {
      expect(engageAudienceMembership(undefined)).toBeUndefined()
    })
  })
})

describe('retlAudienceMembership', () => {
  describe('returns true (added to audience)', () => {
    it('returns true when syncMode is add and event is new', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'new' }, 'add')).toBe(true)
    })

    it('returns true when syncMode is update and event is updated', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'updated' }, 'update')).toBe(true)
    })

    it('returns true when syncMode is upsert and event is new', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'new' }, 'upsert')).toBe(true)
    })

    it('returns true when syncMode is upsert and event is updated', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'updated' }, 'upsert')).toBe(true)
    })

    it('returns true when syncMode is mirror and event is new', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'new' }, 'mirror')).toBe(true)
    })

    it('returns true when syncMode is mirror and event is updated', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'updated' }, 'mirror')).toBe(true)
    })
  })

  describe('returns false (removed from audience)', () => {
    it('returns false when syncMode is delete and event is deleted', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'deleted' }, 'delete')).toBe(false)
    })

    it('returns false when syncMode is mirror and event is deleted', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'deleted' }, 'mirror')).toBe(false)
    })
  })

  describe('failure cases', () => {
    it('returns undefined when rawData is undefined', () => {
      expect(retlAudienceMembership(undefined, 'add')).toBeUndefined()
    })

    it('returns undefined when syncMode is missing', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'new' })).toBeUndefined()
    })

    it('returns undefined when event type is not track', () => {
      expect(retlAudienceMembership({ type: 'identify', event: 'new' }, 'add')).toBeUndefined()
    })

    it('returns undefined when syncMode is add but event is not new', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'updated' }, 'add')).toBeUndefined()
    })

    it('returns undefined when syncMode is delete but event is not deleted', () => {
      expect(retlAudienceMembership({ type: 'track', event: 'new' }, 'delete')).toBeUndefined()
    })
  })
})

function makeDestination(captureRef: {
  data?: ExecuteInput<JSONObject, JSONObject>
}): DestinationDefinition<JSONObject> {
  return {
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
        syncMode: {
          default: 'add',
          label: 'Sync Mode',
          description: 'The sync mode',
          choices: [
            { label: 'Add', value: 'add' },
            { label: 'Update', value: 'update' },
            { label: 'Upsert', value: 'upsert' },
            { label: 'Delete', value: 'delete' },
            { label: 'Mirror', value: 'mirror' }
          ]
        },
        perform: (_request, data) => {
          captureRef.data = data as ExecuteInput<JSONObject, JSONObject>
        }
      }
    }
  }
}

async function runAction(
  event: object,
  mapping: JSONObject = { userId: { '@path': '$.userId' } },
  features: Record<string, boolean> = {}
): Promise<ExecuteInput<JSONObject, JSONObject> | undefined> {
  const captureRef: { data?: ExecuteInput<JSONObject, JSONObject> } = {}
  const testDestination = createTestIntegration(makeDestination(captureRef))
  await testDestination.testAction('testAction', { mapping, event, features })
  return captureRef.data
}

describe('audienceMembership on ExecuteInput in perform()', () => {
  describe('Engage payloads', () => {
    it('is true for identify event with membership in traits', async () => {
      const data = await runAction(
        {
          type: 'identify',
          userId: 'user-1',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: { my_audience: true }
        },
        undefined
      )
      expect(data?.audienceMembership).toBe(true)
    })

    it('is false for identify event with membership in traits', async () => {
      const data = await runAction(
        {
          type: 'identify',
          userId: 'user-1',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: { my_audience: false }
        },
        undefined
      )
      expect(data?.audienceMembership).toBe(false)
    })

    it('is true for track event with membership in properties', async () => {
      const data = await runAction(
        {
          type: 'track',
          userId: 'user-1',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: true }
        },
        undefined
      )
      expect(data?.audienceMembership).toBe(true)
    })

    it('is false for track event with membership in properties', async () => {
      const data = await runAction(
        {
          type: 'track',
          userId: 'user-1',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { my_audience: false }
        },
        undefined
      )
      expect(data?.audienceMembership).toBe(false)
    })
  })

  describe('RETL payloads', () => {
    it('is true for track event with syncMode add and event name new', async () => {
      const data = await runAction(
        { type: 'track', userId: 'user-1', event: 'new' },
        { userId: { '@path': '$.userId' }, __segment_internal_sync_mode: 'add' }
      )
      expect(data?.audienceMembership).toBe(true)
    })

    it('is false for track event with syncMode delete and event name deleted', async () => {
      const data = await runAction(
        { type: 'track', userId: 'user-1', event: 'deleted' },
        { userId: { '@path': '$.userId' }, __segment_internal_sync_mode: 'delete' }
      )
      expect(data?.audienceMembership).toBe(false)
    })
  })

  describe('non-audience events', () => {
    it('is undefined for a non-audience event', async () => {
      const data = await runAction(
        {
          type: 'track',
          userId: 'user-1',
          properties: { foo: 'bar' }
        },
        undefined
      )
      expect(data?.audienceMembership).toBeUndefined()
    })
  })
})

describe('audienceMembership on ExecuteInput in performBatch() when some events fail schema validation', () => {
  const batchDestination: DestinationDefinition<JSONObject> = {
    name: 'Batch Test Destination',
    mode: 'cloud',
    authentication: { scheme: 'custom', fields: {} },
    actions: {
      batchAction: {
        title: 'Batch Action',
        description: 'Batch Action',
        fields: {
          userId: { label: 'User ID', description: 'The user ID', type: 'string', required: true }
        },
        syncMode: {
          default: 'mirror',
          label: 'Sync Mode',
          description: 'Sync mode',
          choices: [
            { label: 'Mirror', value: 'mirror' },
            { label: 'Delete', value: 'delete' }
          ]
        },
        perform: (_request) => 'ok',
        performBatch: (_request, data) => {
          capturedBatchData = data as ExecuteInput<JSONObject, JSONObject[]>
          return 'batch ok'
        }
      }
    }
  }

  let capturedBatchData: ExecuteInput<JSONObject, JSONObject[]> | undefined

  beforeEach(() => {
    capturedBatchData = undefined
  })

  it('audienceMembership length matches payload length when an invalid event is filtered out', async () => {
    const destination = new Destination(batchDestination)

    const validEvent1 = createTestEvent({ type: 'track', userId: 'user-1', event: 'new' })
    const validEvent2 = createTestEvent({ type: 'track', userId: 'user-2', event: 'new' })
    const invalidEvent = createTestEvent({ type: 'track', userId: undefined, event: 'new' })

    await destination.onBatch([validEvent1, invalidEvent, validEvent2], {
      subscription: {
        subscribe: 'type = "track"',
        partnerAction: 'batchAction',
        mapping: {
          userId: { '@path': '$.userId' },
          __segment_internal_sync_mode: 'mirror'
        }
      }
    })

    expect(capturedBatchData).toBeDefined()
    expect(capturedBatchData!.payload.length).toBe(2)
    expect(capturedBatchData!.audienceMembership!.length).toBe(2)
  })

  it('rawData length matches payload length when an invalid event is filtered out', async () => {
    const destination = new Destination(batchDestination)

    const validEvent1 = createTestEvent({ type: 'track', userId: 'user-1', event: 'new' })
    const validEvent2 = createTestEvent({ type: 'track', userId: 'user-2', event: 'new' })
    const invalidEvent = createTestEvent({ type: 'track', userId: undefined, event: 'new' })

    await destination.onBatch([validEvent1, invalidEvent, validEvent2], {
      subscription: {
        subscribe: 'type = "track"',
        partnerAction: 'batchAction',
        mapping: {
          userId: { '@path': '$.userId' },
          __segment_internal_sync_mode: 'mirror'
        }
      }
    })

    expect(capturedBatchData).toBeDefined()
    expect(capturedBatchData!.payload.length).toBe(2)
    expect((capturedBatchData!.rawData as JSONObject[]).length).toBe(2)
  })
})
