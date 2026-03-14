import { createTestIntegration } from '../create-test-integration'
import { engageAudienceMembership, retlAudienceMembership } from '../audience-membership'
import { DestinationDefinition } from '../destination-kit'
import { ExecuteInput } from '../destination-kit/types'
import { JSONObject } from '../json-object'
import { FLAGS } from '../flags'

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

function makeDestination(
  captureRef: { data?: ExecuteInput<JSONObject, JSONObject> }
): DestinationDefinition<JSONObject> {
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
  const flag = { [FLAGS.ACTIONS_CORE_AUDIENCE_MEMBERSHIP]: true }

  describe('Engage payloads', () => {
    it('is true for identify event with membership in traits', async () => {
      const data = await runAction({
        type: 'identify',
        userId: 'user-1',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { my_audience: true }
      }, undefined, flag)
      expect(data?.audienceMembership).toBe(true)
    })

    it('is false for identify event with membership in traits', async () => {
      const data = await runAction({
        type: 'identify',
        userId: 'user-1',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { my_audience: false }
      }, undefined, flag)
      expect(data?.audienceMembership).toBe(false)
    })

    it('is true for track event with membership in properties', async () => {
      const data = await runAction({
        type: 'track',
        userId: 'user-1',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: { my_audience: true }
      }, undefined, flag)
      expect(data?.audienceMembership).toBe(true)
    })

    it('is false for track event with membership in properties', async () => {
      const data = await runAction({
        type: 'track',
        userId: 'user-1',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: { my_audience: false }
      }, undefined, flag)
      expect(data?.audienceMembership).toBe(false)
    })
  })

  describe('RETL payloads', () => {
    it('is true for track event with syncMode add and event name new', async () => {
      const data = await runAction(
        { type: 'track', userId: 'user-1', event: 'new' },
        { userId: { '@path': '$.userId' }, __segment_internal_sync_mode: 'add' },
        flag
      )
      expect(data?.audienceMembership).toBe(true)
    })

    it('is false for track event with syncMode delete and event name deleted', async () => {
      const data = await runAction(
        { type: 'track', userId: 'user-1', event: 'deleted' },
        { userId: { '@path': '$.userId' }, __segment_internal_sync_mode: 'delete' },
        flag
      )
      expect(data?.audienceMembership).toBe(false)
    })
  })

  describe('non-audience events', () => {
    it('is undefined for a non-audience event', async () => {
      const data = await runAction({
        type: 'track',
        userId: 'user-1',
        properties: { foo: 'bar' }
      }, undefined, flag)
      expect(data?.audienceMembership).toBeUndefined()
    })
  })

  describe('feature flag', () => {
    it('is undefined when the actions-core-audience-membership flag is not present', async () => {
      const data = await runAction({
        type: 'identify',
        userId: 'user-1',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { my_audience: true }
      })
      expect(data?.audienceMembership).toBeUndefined()
    })
  })
})
