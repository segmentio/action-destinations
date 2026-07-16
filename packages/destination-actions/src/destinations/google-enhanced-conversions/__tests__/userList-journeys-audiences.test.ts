import nock from 'nock'
import { createTestEvent, createTestIntegration, FLAGS } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION } from '../functions'
import { SegmentEvent } from '@segment/actions-core'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'

const mapping = {
  crm_id: { '@path': '$.userId' },
  event_name: { '@path': '$.event' },
  ad_user_data_consent_state: 'GRANTED',
  ad_personalization_consent_state: 'GRANTED',
  external_audience_id: '1234',
  retlOnMappingSave: {
    outputs: {
      id: '1234',
      name: 'Test List',
      external_id_type: 'CRM_ID'
    }
  }
}

const expectedCreateOperation = {
  create: {
    userIdentifiers: { thirdPartyUserId: 'user_123' }
  }
}

const expectedRemoveOperation = {
  remove: {
    userIdentifiers: { thirdPartyUserId: 'user_123' }
  }
}

const expectedJobPayload = JSON.stringify({
  job: {
    type: 'CUSTOMER_MATCH_USER_LIST',
    customerMatchUserListMetadata: {
      userList: 'customers/1234/userLists/1234',
      consent: { adUserData: 'GRANTED', adPersonalization: 'GRANTED' }
    }
  }
})

const flagCases = [
  { name: 'flag OFF', features: undefined },
  { name: 'flag ON', features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true } }
]

function setupNocksForPerform() {
  nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
    .post(/.*/)
    .reply(200, { data: 'offlineDataJob' })

  nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
    .post(/.*/)
    .reply(200, { data: 'offlineDataJob' })

  nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`)
    .post(/.*/)
    .reply(200, { data: 'offlineDataJob' })
}

function setupNocksForBatch(interceptedBodies?: any[]) {
  nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
    .post(/.*/, (body: any) => {
      interceptedBodies?.push({ type: 'create', body })
      return true
    })
    .reply(200, { resourceName: 'customers/1234/userLists/1234' })

  nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
    .post(/.*/, (body: any) => {
      interceptedBodies?.push({ type: 'addOperations', body })
      return true
    })
    .reply(200, {})

  nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`).post(/.*/).reply(200, { done: true })
}

function createJourneyEvent(eventName: string, computationKey: string): SegmentEvent {
  return createTestEvent({
    timestamp,
    type: 'track',
    userId: 'user_123',
    event: eventName,
    properties: {
      journey_context: {
        'New Google Enhanced Conversions User': {}
      },
      journey_metadata: {
        epoch_id: 'epo_64ac13af-4914-4a79-9580-ac928c7fd9b8',
        journey_id: 'jver_3DfJQ5k3kviG5O2UbMTG82QnMqX',
        journey_name: 'journey3'
      }
    },
    context: {
      personas: {
        computation_id: 'journey_123',
        computation_key: computationKey,
        computation_class: 'journey_step',
        namespace: 'spa_abc'
      }
    }
  })
}

function createAudienceEvent(eventName: string, computationKey: string, computationKeyValue?: boolean): SegmentEvent {
  const properties: Record<string, unknown> = {}
  if (typeof computationKeyValue === 'boolean') {
    properties[computationKey] = computationKeyValue
  }

  return createTestEvent({
    timestamp,
    type: 'track',
    userId: 'user_123',
    event: eventName,
    properties,
    context: {
      personas: {
        computation_id: 'aud_123',
        computation_key: computationKey,
        computation_class: 'audience',
        namespace: 'spa_abc'
      }
    }
  })
}

describe('GoogleEnhancedConversions userList - Journeys & Audiences', () => {
  beforeEach(() => {
    nock.cleanAll()
    testDestination.responses = []
  })
  afterEach(() => nock.cleanAll())

  describe.each(flagCases)('Journey tests ($name)', ({ features }) => {
    const journeyCases = [
      { syncMode: 'add', expectedResult: 'add' },
      { syncMode: 'mirror', expectedResult: 'add' }
    ]

    describe('single event (perform)', () => {
      it.each(journeyCases)(
        'syncMode=$syncMode => $expectedResult (properties never contains computation_key)',
        async ({ syncMode, expectedResult }) => {
          setupNocksForPerform()

          const event = createJourneyEvent('journey3 - Destination', 'journey3 - Destination')

          const responses = await testDestination.testAction('userList', {
            event,
            mapping: {
              ...mapping,
              __segment_internal_sync_mode: syncMode
            },
            useDefaultMappings: true,
            settings: { customerId },
            ...(features && { features })
          })

          // 3 responses = job create + addOperations + job run.
          // User is always added for journey_step because:
          // - Journey properties never contain properties[computation_key], so audienceMembership is undefined
          // - syncMode='add' directly adds, syncMode='mirror' with a non-standard event name
          //   falls through to the computation_class='journey_step' fallback which always adds
          expect(responses.length).toEqual(3)
          expect(responses[0].options.body).toEqual(expectedJobPayload)

          const expectedOp = expectedResult === 'add' ? expectedCreateOperation : expectedRemoveOperation
          expect(responses[1].options.body).toEqual(JSON.stringify({ operations: [expectedOp], enable_warnings: true }))
        }
      )
    })

    describe('batch (performBatch)', () => {
      it.each(journeyCases)(
        'syncMode=$syncMode => $expectedResult (properties never contains computation_key)',
        async ({ syncMode, expectedResult }) => {
          const interceptedBodies: any[] = []
          setupNocksForBatch(interceptedBodies)

          const event = createJourneyEvent('journey3 - Destination', 'journey3 - Destination')

          const responses = await testDestination.executeBatch('userList', {
            events: [event],
            mapping: {
              ...mapping,
              __segment_internal_sync_mode: syncMode
            },
            settings: { customerId },
            ...(features && { features })
          })

          // User is always added for journey_step (same reasoning as perform path above).
          // The batch response reports success with the run URL.
          expect(responses[0]).toMatchObject({
            status: 200,
            sent: '/customers/1234/userLists/1234:run',
            body: { done: true }
          })

          // Verify the addOperations call was a 'create' (user added)
          const addOpCall = interceptedBodies.find((b) => b.type === 'addOperations')
          expect(addOpCall).toBeDefined()

          const expectedOp = expectedResult === 'add' ? expectedCreateOperation : expectedRemoveOperation
          expect(addOpCall.body.operations[0]).toEqual(expectedOp)
        }
      )
    })
  })

  describe.each(flagCases)('Audience tests - standard events ($name)', ({ features }) => {
    const audienceStandardCases = [
      { syncMode: 'add', eventName: 'Audience Entered', computationKeyValue: true, expectedResult: 'add' },
      { syncMode: 'mirror', eventName: 'Audience Entered', computationKeyValue: true, expectedResult: 'add' },
      { syncMode: 'mirror', eventName: 'Audience Exited', computationKeyValue: false, expectedResult: 'remove' },
      { syncMode: 'delete', eventName: 'Audience Exited', computationKeyValue: false, expectedResult: 'remove' }
    ]

    describe('single event (perform)', () => {
      it.each(audienceStandardCases)(
        'syncMode=$syncMode, event=$eventName => $expectedResult',
        async ({ syncMode, eventName, computationKeyValue, expectedResult }) => {
          setupNocksForPerform()

          const event = createAudienceEvent(eventName, 'my_audience', computationKeyValue)

          const responses = await testDestination.testAction('userList', {
            event,
            mapping: {
              ...mapping,
              __segment_internal_sync_mode: syncMode
            },
            useDefaultMappings: true,
            settings: { customerId },
            ...(features && { features })
          })

          // 3 responses = job create + addOperations + job run.
          // 'Audience Entered' and 'Audience Exited' are standard event names that
          // directly determine add/remove regardless of syncMode or flag state.
          expect(responses.length).toEqual(3)
          expect(responses[0].options.body).toEqual(expectedJobPayload)

          const expectedOp = expectedResult === 'add' ? expectedCreateOperation : expectedRemoveOperation
          expect(responses[1].options.body).toEqual(JSON.stringify({ operations: [expectedOp], enable_warnings: true }))
        }
      )
    })

    describe('batch (performBatch)', () => {
      it.each(audienceStandardCases)(
        'syncMode=$syncMode, event=$eventName => $expectedResult',
        async ({ syncMode, eventName, computationKeyValue, expectedResult }) => {
          const interceptedBodies: any[] = []
          setupNocksForBatch(interceptedBodies)

          const event = createAudienceEvent(eventName, 'my_audience', computationKeyValue)

          const responses = await testDestination.executeBatch('userList', {
            events: [event],
            mapping: {
              ...mapping,
              __segment_internal_sync_mode: syncMode
            },
            settings: { customerId },
            ...(features && { features })
          })

          // 'Audience Entered' always adds, 'Audience Exited' always removes,
          // regardless of syncMode or flag state.
          expect(responses[0]).toMatchObject({
            status: 200,
            sent: '/customers/1234/userLists/1234:run',
            body: { done: true }
          })

          const addOpCall = interceptedBodies.find((b) => b.type === 'addOperations')
          expect(addOpCall).toBeDefined()

          const expectedOp = expectedResult === 'add' ? expectedCreateOperation : expectedRemoveOperation
          expect(addOpCall.body.operations[0]).toEqual(expectedOp)
        }
      )
    })
  })

  describe('Audience tests - custom event names (flag OFF)', () => {
    const customEventCases = [
      { syncMode: 'mirror' as const, computationKeyValue: undefined as boolean | undefined },
      { syncMode: 'mirror' as const, computationKeyValue: true },
      { syncMode: 'mirror' as const, computationKeyValue: false }
    ]

    describe('single event (perform)', () => {
      it.each(customEventCases)(
        'syncMode=$syncMode, computationKeyValue=$computationKeyValue => no operations (job created and run only)',
        async ({ syncMode, computationKeyValue }) => {
          setupNocksForPerform()

          const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', computationKeyValue)

          const responses = await testDestination.testAction('userList', {
            event,
            mapping: {
              ...mapping,
              __segment_internal_sync_mode: syncMode
            },
            useDefaultMappings: true,
            settings: { customerId }
          })

          // 2 responses = job create + job run only. No addOperations call was made,
          // meaning the user was neither added nor removed.
          // With the flag OFF, a custom event name (not 'Audience Entered'/'Audience Exited')
          // combined with mirror syncMode (event is not 'new'/'updated'/'deleted') cannot
          // determine operation type. The perform path silently skips the event.
          expect(responses.length).toEqual(2)
        }
      )
    })

    describe('batch (performBatch)', () => {
      it.each(customEventCases)(
        'syncMode=$syncMode, computationKeyValue=$computationKeyValue => ERROR',
        async ({ syncMode, computationKeyValue }) => {
          nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
            .post(/.*/)
            .reply(200, { resourceName: 'customers/1234/userLists/1234' })

          const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', computationKeyValue)

          const responses = await testDestination.executeBatch('userList', {
            events: [event],
            mapping: {
              ...mapping,
              __segment_internal_sync_mode: syncMode
            },
            settings: { customerId }
          })

          // With the flag OFF, audienceMembership is not consulted, so even when
          // properties[computation_key] is true/false it doesn't help. The batch path
          // explicitly returns an error when operation type cannot be determined.
          expect(responses[0]).toMatchObject({
            status: 400,
            errortype: 'PAYLOAD_VALIDATION_FAILED',
            errormessage: 'Could not determine Operation Type.',
            errorreporter: 'INTEGRATIONS'
          })
        }
      )
    })
  })

  describe('Audience tests - custom event names (flag ON)', () => {
    const features = { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true }

    describe('single event (perform)', () => {
      it('syncMode=mirror, computationKeyValue=undefined => no operations (job created and run only)', async () => {
        setupNocksForPerform()

        const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', undefined)

        const responses = await testDestination.testAction('userList', {
          event,
          mapping: {
            ...mapping,
            __segment_internal_sync_mode: 'mirror'
          },
          useDefaultMappings: true,
          settings: { customerId },
          features
        })

        // 2 responses = job create + job run only. No addOperations call was made.
        // With the flag ON, audienceMembership is consulted but properties[computation_key]
        // is undefined (not a boolean), so audienceMembership resolves to undefined.
        // computation_class='audience' != 'journey_step', so no fallback applies.
        // Operation type cannot be determined; the perform path silently skips.
        expect(responses.length).toEqual(2)
      })

      it('syncMode=mirror, computationKeyValue=true => User added', async () => {
        setupNocksForPerform()

        const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', true)

        const responses = await testDestination.testAction('userList', {
          event,
          mapping: {
            ...mapping,
            __segment_internal_sync_mode: 'mirror'
          },
          useDefaultMappings: true,
          settings: { customerId },
          features
        })

        // 3 responses = job create + addOperations + job run.
        // With the flag ON, properties[computation_key]=true resolves
        // audienceMembership=true, which triggers a 'create' operation (user added).
        expect(responses.length).toEqual(3)
        expect(responses[0].options.body).toEqual(expectedJobPayload)
        expect(responses[1].options.body).toEqual(
          JSON.stringify({ operations: [expectedCreateOperation], enable_warnings: true })
        )
      })

      it('syncMode=mirror, computationKeyValue=false => User removed', async () => {
        setupNocksForPerform()

        const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', false)

        const responses = await testDestination.testAction('userList', {
          event,
          mapping: {
            ...mapping,
            __segment_internal_sync_mode: 'mirror'
          },
          useDefaultMappings: true,
          settings: { customerId },
          features
        })

        // 3 responses = job create + addOperations + job run.
        // With the flag ON, properties[computation_key]=false resolves
        // audienceMembership=false, which triggers a 'remove' operation (user removed).
        expect(responses.length).toEqual(3)
        expect(responses[0].options.body).toEqual(expectedJobPayload)
        expect(responses[1].options.body).toEqual(
          JSON.stringify({ operations: [expectedRemoveOperation], enable_warnings: true })
        )
      })
    })

    describe('batch (performBatch)', () => {
      it('syncMode=mirror, computationKeyValue=undefined => ERROR', async () => {
        nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
          .post(/.*/)
          .reply(200, { resourceName: 'customers/1234/userLists/1234' })

        const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', undefined)

        const responses = await testDestination.executeBatch('userList', {
          events: [event],
          mapping: {
            ...mapping,
            __segment_internal_sync_mode: 'mirror'
          },
          settings: { customerId },
          features
        })

        // With the flag ON but properties[computation_key] undefined,
        // audienceMembership is undefined. Custom event name doesn't match any
        // standard patterns and computation_class='audience' != 'journey_step'.
        // The batch path explicitly returns an error.
        expect(responses[0]).toMatchObject({
          status: 400,
          errortype: 'PAYLOAD_VALIDATION_FAILED',
          errormessage: 'Could not determine Operation Type.',
          errorreporter: 'INTEGRATIONS'
        })
      })

      it('syncMode=mirror, computationKeyValue=true => User added', async () => {
        const interceptedBodies: any[] = []
        setupNocksForBatch(interceptedBodies)

        const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', true)

        const responses = await testDestination.executeBatch('userList', {
          events: [event],
          mapping: {
            ...mapping,
            __segment_internal_sync_mode: 'mirror'
          },
          settings: { customerId },
          features
        })

        // With the flag ON, properties[computation_key]=true resolves
        // audienceMembership=true, which triggers a 'create' operation (user added).
        expect(responses[0]).toMatchObject({
          status: 200,
          sent: '/customers/1234/userLists/1234:run',
          body: { done: true }
        })

        const addOpCall = interceptedBodies.find((b) => b.type === 'addOperations')
        expect(addOpCall).toBeDefined()
        expect(addOpCall.body.operations[0]).toEqual(expectedCreateOperation)
      })

      it('syncMode=mirror, computationKeyValue=false => User removed', async () => {
        const interceptedBodies: any[] = []
        setupNocksForBatch(interceptedBodies)

        const event = createAudienceEvent('CUSTOM_EVENT_NAME', 'my_audience', false)

        const responses = await testDestination.executeBatch('userList', {
          events: [event],
          mapping: {
            ...mapping,
            __segment_internal_sync_mode: 'mirror'
          },
          settings: { customerId },
          features
        })

        // With the flag ON, properties[computation_key]=false resolves
        // audienceMembership=false, which triggers a 'remove' operation (user removed).
        expect(responses[0]).toMatchObject({
          status: 200,
          sent: '/customers/1234/userLists/1234:run',
          body: { done: true }
        })

        const addOpCall = interceptedBodies.find((b) => b.type === 'addOperations')
        expect(addOpCall).toBeDefined()
        expect(addOpCall.body.operations[0]).toEqual(expectedRemoveOperation)
      })
    })
  })

  describe('Mixed batch tests - adds and removes in one batch', () => {
    it('syncMode=mirror with Audience Entered and Audience Exited events in the same batch', async () => {
      // Two addOperations calls expected: one for adds, one for removes.
      const interceptedBodies: any[] = []

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/, (body: any) => {
          interceptedBodies.push({ type: 'create', body })
          return true
        })
        .reply(200, { resourceName: 'customers/1234/userLists/1234' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/, (body: any) => {
          interceptedBodies.push({ type: 'addOperations', body })
          return true
        })
        .times(2)
        .reply(200, {})

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`).post(/.*/).reply(200, { done: true })

      const enterEvent = createTestEvent({
        timestamp,
        type: 'track',
        userId: 'user_add_1',
        event: 'Audience Entered',
        properties: { my_audience: true },
        context: {
          personas: {
            computation_id: 'aud_123',
            computation_key: 'my_audience',
            computation_class: 'audience',
            namespace: 'spa_abc'
          }
        }
      })

      const exitEvent = createTestEvent({
        timestamp,
        type: 'track',
        userId: 'user_remove_1',
        event: 'Audience Exited',
        properties: { my_audience: false },
        context: {
          personas: {
            computation_id: 'aud_123',
            computation_key: 'my_audience',
            computation_class: 'audience',
            namespace: 'spa_abc'
          }
        }
      })

      const responses = await testDestination.executeBatch('userList', {
        events: [enterEvent, exitEvent],
        mapping: {
          ...mapping,
          __segment_internal_sync_mode: 'mirror'
        },
        settings: { customerId },
        features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true }
      })

      // Both events succeed — the batch creates one job with two addOperations calls:
      // one containing the 'create' (add) operation and one containing the 'remove' operation.
      expect(responses[0]).toMatchObject({ status: 200 })
      expect(responses[1]).toMatchObject({ status: 200 })

      const addOpCalls = interceptedBodies.filter((b) => b.type === 'addOperations')
      expect(addOpCalls).toHaveLength(2)

      // First addOperations call contains the 'create' (add) operation
      expect(addOpCalls[0].body.operations).toEqual([
        { create: { userIdentifiers: { thirdPartyUserId: 'user_add_1' } } }
      ])

      // Second addOperations call contains the 'remove' operation
      expect(addOpCalls[1].body.operations).toEqual([
        { remove: { userIdentifiers: { thirdPartyUserId: 'user_remove_1' } } }
      ])
    })

    it('syncMode=mirror with a mix of valid adds, valid removes, and invalid payloads', async () => {
      // Tests that invalid payloads get individual errors while valid adds/removes
      // are still processed in the same job.
      const interceptedBodies: any[] = []

      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/, (body: any) => {
          interceptedBodies.push({ type: 'create', body })
          return true
        })
        .reply(200, { resourceName: 'customers/1234/userLists/1234' })

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:addOperations`)
        .post(/.*/, (body: any) => {
          interceptedBodies.push({ type: 'addOperations', body })
          return true
        })
        .times(2)
        .reply(200, {})

      nock(`https://googleads.googleapis.com/${API_VERSION}/offlineDataJob:run`).post(/.*/).reply(200, { done: true })

      const enterEvent = createTestEvent({
        timestamp,
        type: 'track',
        userId: 'user_add_1',
        event: 'Audience Entered',
        properties: { my_audience: true },
        context: {
          personas: {
            computation_id: 'aud_123',
            computation_key: 'my_audience',
            computation_class: 'audience',
            namespace: 'spa_abc'
          }
        }
      })

      const exitEvent = createTestEvent({
        timestamp,
        type: 'track',
        userId: 'user_remove_1',
        event: 'Audience Exited',
        properties: { my_audience: false },
        context: {
          personas: {
            computation_id: 'aud_123',
            computation_key: 'my_audience',
            computation_class: 'audience',
            namespace: 'spa_abc'
          }
        }
      })

      // Invalid payload: custom event with undefined computation_key value.
      // Operation type cannot be determined → individual 400 error.
      const invalidEvent = createTestEvent({
        timestamp,
        type: 'track',
        userId: 'user_bad_1',
        event: 'CUSTOM_EVENT_NAME',
        properties: {},
        context: {
          personas: {
            computation_id: 'aud_123',
            computation_key: 'my_audience',
            computation_class: 'audience',
            namespace: 'spa_abc'
          }
        }
      })

      const responses = await testDestination.executeBatch('userList', {
        events: [enterEvent, invalidEvent, exitEvent],
        mapping: {
          ...mapping,
          __segment_internal_sync_mode: 'mirror'
        },
        settings: { customerId },
        features: { [FLAGS.ACTIONS_GOOGLE_EC_AUDIENCE_MEMBERSHIP]: true }
      })

      // Index 0 (enterEvent): valid add → succeeds
      expect(responses[0]).toMatchObject({ status: 200 })

      // Index 1 (invalidEvent): custom event, no properties[computation_key], flag ON →
      // audienceMembership is undefined, event name doesn't match standard patterns,
      // computation_class='audience' != 'journey_step' → cannot determine operation type → 400
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: 'Could not determine Operation Type.'
      })

      // Index 2 (exitEvent): valid remove → succeeds
      expect(responses[2]).toMatchObject({ status: 200 })

      // The two valid payloads still produced two addOperations calls
      const addOpCalls = interceptedBodies.filter((b) => b.type === 'addOperations')
      expect(addOpCalls).toHaveLength(2)

      expect(addOpCalls[0].body.operations).toEqual([
        { create: { userIdentifiers: { thirdPartyUserId: 'user_add_1' } } }
      ])
      expect(addOpCalls[1].body.operations).toEqual([
        { remove: { userIdentifiers: { thirdPartyUserId: 'user_remove_1' } } }
      ])
    })
  })
})
