import nock from 'nock'
import {
  testDestination,
  customerId,
  mapping,
  FLAG_ON,
  setupNocksForPerform,
  setupNocksForBatch,
  setupNocksForBatchPartialFailure,
  createJourneyV2Event,
  createOperation,
  removeOperation,
  successNode,
  validationErrorNode,
  partialFailureNode
} from './__helpers__/userList-audiences-helpers'

// Journeys V2: journey_step events that carry the membership boolean properties[computation_key].
// V2 is ONLY ever sent with the audience-membership feature flag ON, so every test here enables it.
// The operation is driven by the boolean: true => add, false => remove.
describe('GoogleEnhancedConversions userList - Journeys V2 (flag ON)', () => {
  beforeEach(() => {
    nock.cleanAll()
    testDestination.responses = []
  })
  afterEach(() => nock.cleanAll())

  const exec = (events: Parameters<typeof testDestination.executeBatch>[1]['events']) =>
    testDestination.executeBatch('userList', {
      events,
      mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
      settings: { customerId },
      features: FLAG_ON
    })

  describe('single event (perform)', () => {
    it('computation_key=true => adds the user', async () => {
      setupNocksForPerform()
      const responses = await testDestination.testAction('userList', {
        event: createJourneyV2Event('v2_single_add', true),
        mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
        useDefaultMappings: true,
        settings: { customerId },
        features: FLAG_ON
      })
      // perform path returns raw HTTP responses (create job, addOperations, run job).
      expect(responses.length).toEqual(3)
      expect(responses[1].options.json).toEqual({
        operations: [createOperation('v2_single_add')],
        enable_warnings: true
      })
    })

    it('computation_key=false => removes the user', async () => {
      setupNocksForPerform()
      const responses = await testDestination.testAction('userList', {
        event: createJourneyV2Event('v2_single_remove', false),
        mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
        useDefaultMappings: true,
        settings: { customerId },
        features: FLAG_ON
      })
      expect(responses.length).toEqual(3)
      expect(responses[1].options.json).toEqual({
        operations: [removeOperation('v2_single_remove')],
        enable_warnings: true
      })
    })
  })

  describe('batch (performBatch)', () => {
    it('batch add (all computation_key=true)', async () => {
      setupNocksForBatch(1)
      const responses = await exec([createJourneyV2Event('v2a1', true), createJourneyV2Event('v2a2', true)])
      expect(responses).toMatchObject([successNode(createOperation('v2a1')), successNode(createOperation('v2a2'))])
    })

    it('batch remove (all computation_key=false)', async () => {
      setupNocksForBatch(1)
      const responses = await exec([createJourneyV2Event('v2r1', false), createJourneyV2Event('v2r2', false)])
      expect(responses).toMatchObject([successNode(removeOperation('v2r1')), successNode(removeOperation('v2r2'))])
    })

    it('batch mixed adds and removes', async () => {
      setupNocksForBatch(2)
      const responses = await exec([
        createJourneyV2Event('v2m0', true),
        createJourneyV2Event('v2m1', false),
        createJourneyV2Event('v2m2', true)
      ])
      expect(responses).toMatchObject([
        successNode(createOperation('v2m0')),
        successNode(removeOperation('v2m1')),
        successNode(createOperation('v2m2'))
      ])
    })

    it('batch mixed with an invalid payload (missing identifier)', async () => {
      setupNocksForBatch(2)
      const responses = await exec([
        createJourneyV2Event('v2x0', true),
        createJourneyV2Event('v2x1', false),
        createJourneyV2Event(undefined, true)
      ])
      expect(responses).toMatchObject([
        successNode(createOperation('v2x0')),
        successNode(removeOperation('v2x1')),
        validationErrorNode()
      ])
    })

    it('batch mixed with a Google partial-failure response', async () => {
      setupNocksForBatchPartialFailure(0)
      // Order: add (Google rejects this op), remove (ok), invalid (missing identifier).
      const responses = await exec([
        createJourneyV2Event('v2f0', true),
        createJourneyV2Event('v2f1', false),
        createJourneyV2Event(undefined, true)
      ])
      expect(responses).toMatchObject([
        partialFailureNode(createOperation('v2f0')),
        successNode(removeOperation('v2f1')),
        validationErrorNode()
      ])
    })
  })
})
