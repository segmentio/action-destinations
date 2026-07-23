import { createTestIntegration } from '../create-test-integration'
import { createTestEvent } from '../create-test-event'
import { engageAudienceMembership, retlAudienceMembership, legacyJourneysAudienceMembership } from '../audience-membership'
import { FLAGS } from '../flags'
import { DestinationDefinition } from '../destination-kit'
import { ExecuteInput } from '../destination-kit/types'
import { JSONObject } from '../json-object'
import { SegmentEvent } from '../segment-event'

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

describe('legacyJourneysAudienceMembership', () => {
  describe('returns true (added to audience)', () => {
    it('returns true when computation_class is journey_step and computation_key is missing', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'journey_step' } },
          properties: {}
        })
      ).toBe(true)
    })

    it('returns true when type is track and properties[computation_key] is absent', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          properties: {}
        })
      ).toBe(true)
    })

    it('returns true when type is track and properties[computation_key] is not a boolean', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          properties: { my_step: 'true' }
        })
      ).toBe(true)
    })

    it('returns true when type is identify and traits[computation_key] is absent', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          traits: {}
        })
      ).toBe(true)
    })

    it('returns true when type is identify and traits[computation_key] is not a boolean', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          traits: { my_step: 'true' }
        })
      ).toBe(true)
    })
  })

  describe('returns undefined', () => {
    it('returns undefined when rawData is undefined', () => {
      expect(legacyJourneysAudienceMembership(undefined)).toBeUndefined()
    })

    it('returns undefined when computation_class is not journey_step', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: {}
        })
      ).toBeUndefined()
    })

    it('returns undefined when computation_class is missing', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'track',
          context: { personas: { computation_key: 'my_step' } },
          properties: {}
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is track and properties[computation_key] is a boolean', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'track',
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          properties: { my_step: true }
        })
      ).toBeUndefined()
    })

    it('returns undefined when type is identify and traits[computation_key] is a boolean', () => {
      expect(
        legacyJourneysAudienceMembership({
          type: 'identify',
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          traits: { my_step: false }
        })
      ).toBeUndefined()
    })
  })
})

interface BatchCaptureRef {
  payload?: JSONObject[]
  audienceMembership?: (boolean | undefined)[]
}

function makeBatchDestination(captureRef: BatchCaptureRef): DestinationDefinition<JSONObject> {
  return {
    name: 'Test Batch Destination',
    mode: 'cloud',
    authentication: { scheme: 'custom', fields: {} },
    actions: {
      testAction: {
        title: 'Test Action',
        description: 'Test',
        fields: {
          userId: { label: 'User ID', description: 'The user ID', type: 'string', required: true },
          count: { label: 'Count', description: 'A required number', type: 'number', required: true }
        },
        perform: (_request) => {
          return
        },
        performBatch: (_request, data) => {
          captureRef.payload = data.payload as JSONObject[]
          captureRef.audienceMembership = data.audienceMembership as (boolean | undefined)[]
        }
      }
    }
  }
}

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

  describe('Legacy Journeys payloads (feature flagged)', () => {
    const legacyJourneyEvent = {
      type: 'track',
      userId: 'user-1',
      context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
      properties: {}
    }

    it('is true when the feature flag is enabled', async () => {
      const data = await runAction(legacyJourneyEvent, undefined, {
        [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: true
      })
      expect(data?.audienceMembership).toBe(true)
    })

    it('is undefined when the feature flag is disabled', async () => {
      const data = await runAction(legacyJourneyEvent, undefined, {
        [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: false
      })
      expect(data?.audienceMembership).toBeUndefined()
    })

    it('is undefined when the feature flag is absent', async () => {
      const data = await runAction(legacyJourneyEvent, undefined)
      expect(data?.audienceMembership).toBeUndefined()
    })
  })
})

describe('audienceMembership on ExecuteInput in performBatch()', () => {
  it('only processes valid payloads and aligns audienceMembership correctly when one event fails validation', async () => {
    const captureRef: BatchCaptureRef = {}
    const testDestination = createTestIntegration(makeBatchDestination(captureRef))

    const events = [
      createTestEvent({
        type: 'identify',
        userId: 'user-1',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { my_audience: true },
        properties: { count: 1 }
      }),
      createTestEvent({
        type: 'identify',
        userId: 'user-2',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { my_audience: false },
        properties: { count: 2 }
      }),
      createTestEvent({
        type: 'identify',
        userId: 'user-3',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { my_audience: true },
        properties: { count: 'not-a-number' }
      }),
      createTestEvent({
        type: 'identify',
        userId: 'user-4',
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { my_audience: false },
        properties: { count: 4 }
      })
    ]

    await testDestination.testBatchAction('testAction', {
      events,
      mapping: {
        userId: { '@path': '$.userId' },
        count: { '@path': '$.properties.count' }
      }
    })

    expect(captureRef.payload).toHaveLength(3)
    expect(captureRef.payload).toEqual([
      { userId: 'user-1', count: 1 },
      { userId: 'user-2', count: 2 },
      { userId: 'user-4', count: 4 }
    ])

    expect(captureRef.audienceMembership).toHaveLength(3)
    expect(captureRef.audienceMembership).toEqual([true, false, false])
  })

  describe('Legacy Journeys payloads (feature flagged)', () => {
    const legacyJourneyEvents: Partial<SegmentEvent>[] = [
      {
        type: 'track',
        userId: 'user-1',
        context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
        properties: { count: 1 }
      },
      {
        type: 'track',
        userId: 'user-2',
        context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
        properties: { count: 2 }
      }
    ]
    const mapping = {
      userId: { '@path': '$.userId' },
      count: { '@path': '$.properties.count' }
    }

    it('resolves membership to true when the feature flag is enabled', async () => {
      const captureRef: BatchCaptureRef = {}
      const testDestination = createTestIntegration(makeBatchDestination(captureRef))

      await testDestination.testBatchAction('testAction', {
        events: legacyJourneyEvents.map((event) => createTestEvent(event)),
        mapping,
        features: { [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: true }
      })

      expect(captureRef.audienceMembership).toEqual([true, true])
    })

    it('leaves membership undefined when the feature flag is disabled', async () => {
      const captureRef: BatchCaptureRef = {}
      const testDestination = createTestIntegration(makeBatchDestination(captureRef))

      await testDestination.testBatchAction('testAction', {
        events: legacyJourneyEvents.map((event) => createTestEvent(event)),
        mapping,
        features: { [FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP]: false }
      })

      expect(captureRef.audienceMembership).toEqual([undefined, undefined])
    })
  })
})
