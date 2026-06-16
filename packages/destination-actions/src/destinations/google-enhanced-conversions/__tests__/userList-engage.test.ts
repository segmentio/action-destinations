import nock from 'nock'
import {
  testDestination,
  customerId,
  mapping,
  flagCases,
  setupNocksForPerform,
  setupNocksForBatch,
  setupNocksForBatchPartialFailure,
  createEngageEvent,
  createOperation,
  removeOperation,
  successNode,
  validationErrorNode,
  partialFailureNode
} from './__helpers__/userList-audiences-helpers'

// Engage (audience) events: add/remove is driven by the "Audience Entered"/"Audience Exited" event
// name, and is independent of the audience-membership feature flag — so every scenario is run under
// both flag states and asserts the same result.
describe('GoogleEnhancedConversions userList - Engage', () => {
  beforeEach(() => {
    nock.cleanAll()
    testDestination.responses = []
  })
  afterEach(() => nock.cleanAll())

  describe.each(flagCases)('$name', ({ features }) => {
    const exec = (events: Parameters<typeof testDestination.executeBatch>[1]['events']) =>
      testDestination.executeBatch('userList', {
        events,
        mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
        settings: { customerId },
        ...(features && { features })
      })

    describe('single event (perform)', () => {
      it('Audience Entered => adds the user', async () => {
        setupNocksForPerform()
        const responses = await testDestination.testAction('userList', {
          event: createEngageEvent('eng_single_add', 'add', true),
          mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
          useDefaultMappings: true,
          settings: { customerId },
          ...(features && { features })
        })
        expect(responses.length).toEqual(3)
        expect(responses[1].options.json).toEqual({
          operations: [createOperation('eng_single_add')],
          enable_warnings: true
        })
      })

      it('Audience Exited => removes the user', async () => {
        setupNocksForPerform()
        const responses = await testDestination.testAction('userList', {
          event: createEngageEvent('eng_single_remove', 'remove', false),
          mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
          useDefaultMappings: true,
          settings: { customerId },
          ...(features && { features })
        })
        expect(responses.length).toEqual(3)
        expect(responses[1].options.json).toEqual({
          operations: [removeOperation('eng_single_remove')],
          enable_warnings: true
        })
      })
    })

    describe('batch (performBatch)', () => {
      it('batch add', async () => {
        setupNocksForBatch(1)
        const responses = await exec([
          createEngageEvent('ea1', 'add', true),
          createEngageEvent('ea2', 'add', true)
        ])
        expect(responses).toMatchObject([successNode(createOperation('ea1')), successNode(createOperation('ea2'))])
      })

      it('batch remove', async () => {
        setupNocksForBatch(1)
        const responses = await exec([
          createEngageEvent('er1', 'remove', false),
          createEngageEvent('er2', 'remove', false)
        ])
        expect(responses).toMatchObject([successNode(removeOperation('er1')), successNode(removeOperation('er2'))])
      })

      it('batch mixed adds and removes', async () => {
        setupNocksForBatch(2)
        const responses = await exec([
          createEngageEvent('em0', 'add', true),
          createEngageEvent('em1', 'remove', false),
          createEngageEvent('em2', 'add', true)
        ])
        expect(responses).toMatchObject([
          successNode(createOperation('em0')),
          successNode(removeOperation('em1')),
          successNode(createOperation('em2'))
        ])
      })

      it('batch mixed with an invalid payload (missing identifier)', async () => {
        setupNocksForBatch(2)
        const responses = await exec([
          createEngageEvent('ex0', 'add', true),
          createEngageEvent('ex1', 'remove', false),
          createEngageEvent(undefined, 'add', true)
        ])
        expect(responses).toMatchObject([
          successNode(createOperation('ex0')),
          successNode(removeOperation('ex1')),
          validationErrorNode()
        ])
      })

      it('batch mixed with a Google partial-failure response', async () => {
        setupNocksForBatchPartialFailure(0)
        // Order: add (Google rejects this op), remove (ok), invalid (missing identifier).
        const responses = await exec([
          createEngageEvent('ef0', 'add', true),
          createEngageEvent('ef1', 'remove', false),
          createEngageEvent(undefined, 'add', true)
        ])
        expect(responses).toMatchObject([
          partialFailureNode(createOperation('ef0')),
          successNode(removeOperation('ef1')),
          validationErrorNode()
        ])
      })
    })
  })
})
