import nock from 'nock'
import {
  testDestination,
  customerId,
  mapping,
  flagCases,
  setupNocksForPerform,
  setupNocksForBatch,
  setupNocksForBatchPartialFailure,
  createJourneyV1Event,
  createOperation,
  successNode,
  validationErrorNode,
  partialFailureNode
} from './__helpers__/userList-audiences-helpers'

// Journeys V1: events always use the "Audience Entered" event name and never carry
// properties[computation_key]. They ALWAYS add (V1 has no remove path), and this is true whether the
// audience-membership feature flag is on or off — so every scenario is run under both flag states.
describe('GoogleEnhancedConversions userList - Journeys V1', () => {
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
      it('adds the user', async () => {
        setupNocksForPerform()
        const responses = await testDestination.testAction('userList', {
          event: createJourneyV1Event('v1_single_add'),
          mapping: { ...mapping, __segment_internal_sync_mode: 'mirror' },
          useDefaultMappings: true,
          settings: { customerId },
          ...(features && { features })
        })
        expect(responses.length).toEqual(3)
        expect(responses[1].options.json).toEqual({
          operations: [createOperation('v1_single_add')],
          enable_warnings: true
        })
      })
    })

    describe('batch (performBatch)', () => {
      it('batch add', async () => {
        setupNocksForBatch(1)
        const responses = await exec([createJourneyV1Event('v1a1'), createJourneyV1Event('v1a2')])
        expect(responses).toMatchObject([successNode(createOperation('v1a1')), successNode(createOperation('v1a2'))])
      })

      it('batch mixed with an invalid payload (missing identifier)', async () => {
        setupNocksForBatch(1)
        const responses = await exec([
          createJourneyV1Event('v1x0'),
          createJourneyV1Event(undefined as unknown as string),
          createJourneyV1Event('v1x2')
        ])
        expect(responses).toMatchObject([
          successNode(createOperation('v1x0')),
          validationErrorNode(),
          successNode(createOperation('v1x2'))
        ])
      })

      it('batch mixed with a Google partial-failure response', async () => {
        setupNocksForBatchPartialFailure(0, false) // V1 is all-adds => single addOperations call
        // All adds; Google rejects the operation at index 0, the rest succeed.
        const responses = await exec([
          createJourneyV1Event('v1f0'),
          createJourneyV1Event('v1f1'),
          createJourneyV1Event(undefined as unknown as string)
        ])
        expect(responses).toMatchObject([
          partialFailureNode(createOperation('v1f0')),
          successNode(createOperation('v1f1')),
          validationErrorNode()
        ])
      })
    })
  })
})
