import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import { SegmentEvent } from '@segment/actions-core'
import { FLAGS } from '@segment/actions-core'
import GoogleEnhancedConversions from '../index'
import { API_VERSION } from '../functions'

const testDestination = createTestIntegration(GoogleEnhancedConversions)
const timestamp = new Date('Thu Jun 10 2021 11:08:04 GMT-0700 (Pacific Daylight Time)').toISOString()
const customerId = '1234'
const resourceName = `customers/${customerId}/userLists/1234`

// Feature flag that unlocks the legacy-journeys fallback (journey_step with no membership boolean => add)
const LEGACY_JOURNEYS_FLAG = FLAGS.ACTIONS_LEGACY_JOURNEYS_AUDIENCE_MEMBERSHIP

// PII lives in properties for track events, traits for identify events. The membership boolean
// (properties/traits[computation_key]) is what drives resolveAudienceMembership in core.
const contactInfo = {
  email: 'test@gmail.com',
  phone: '3234567890',
  firstName: 'Jane',
  lastName: 'Doe'
}

const trackMapping = {
  email: { '@path': '$.properties.email' },
  phone: { '@path': '$.properties.phone' },
  first_name: { '@path': '$.properties.firstName' },
  last_name: { '@path': '$.properties.lastName' },
  event_name: { '@path': '$.event' },
  ad_user_data_consent_state: 'GRANTED',
  ad_personalization_consent_state: 'GRANTED',
  external_audience_id: '1234',
  retlOnMappingSave: {
    outputs: {
      id: '1234',
      name: 'Test List',
      external_id_type: 'CONTACT_INFO'
    }
  }
}

const identifyMapping = {
  ...trackMapping,
  email: { '@path': '$.traits.email' },
  phone: { '@path': '$.traits.phone' },
  first_name: { '@path': '$.traits.firstName' },
  last_name: { '@path': '$.traits.lastName' }
}

// Neutral event name so that add/remove routing can ONLY come from audienceMembership,
// never from the event_name branch (Audience Entered/Exited/new/updated/deleted).
const NEUTRAL_EVENT = 'Audience Membership Changed'

/**
 * Sets up the create -> addOperations -> run nock chain for a single-event perform() call.
 * The addOperations interceptor asserts that every operation is of `expectedOp` (create/remove),
 * so a mis-routed operation fails to match and the request errors out.
 */
function mockPerformChain(expectedOp: 'create' | 'remove') {
  nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
    .post(/.*/)
    .reply(200, { resourceName })

  nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:addOperations`)
    .post(/.*/, (body: Record<string, unknown>) => {
      const operations = body.operations as Array<Record<string, unknown>>
      return operations.length > 0 && operations.every((op) => expectedOp in op)
    })
    .reply(200, {})

  nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:run`).post(/.*/).reply(200, { done: true })
}

afterEach(() => {
  nock.cleanAll()
})

describe('GoogleEnhancedConversions - userList audienceMembership', () => {
  describe('perform() - computation_class: audience', () => {
    it('track event with properties[computation_key] = true is routed as an add', async () => {
      mockPerformChain('create')

      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: NEUTRAL_EVENT,
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: { ...contactInfo, my_audience: true }
      })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: trackMapping,
        settings: { customerId }
      })

      expect(responses.length).toEqual(3)
      expect(nock.isDone()).toBe(true)
    })

    it('track event with properties[computation_key] = false is routed as a remove', async () => {
      mockPerformChain('remove')

      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: NEUTRAL_EVENT,
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        properties: { ...contactInfo, my_audience: false }
      })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: trackMapping,
        settings: { customerId }
      })

      expect(responses.length).toEqual(3)
      expect(nock.isDone()).toBe(true)
    })

    it('identify event with traits[computation_key] = true is routed as an add', async () => {
      mockPerformChain('create')

      const event = createTestEvent({
        timestamp,
        type: 'identify',
        event: NEUTRAL_EVENT,
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { ...contactInfo, my_audience: true }
      })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: identifyMapping,
        settings: { customerId }
      })

      expect(responses.length).toEqual(3)
      expect(nock.isDone()).toBe(true)
    })

    it('identify event with traits[computation_key] = false is routed as a remove', async () => {
      mockPerformChain('remove')

      const event = createTestEvent({
        timestamp,
        type: 'identify',
        event: NEUTRAL_EVENT,
        context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
        traits: { ...contactInfo, my_audience: false }
      })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: identifyMapping,
        settings: { customerId }
      })

      expect(responses.length).toEqual(3)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('perform() - computation_class: journey_step', () => {
    it('track event WITH a boolean membership is routed by that boolean (no flag needed)', async () => {
      mockPerformChain('remove')

      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: NEUTRAL_EVENT,
        context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
        properties: { ...contactInfo, my_step: false }
      })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: { ...trackMapping, retlOnMappingSave: trackMapping.retlOnMappingSave },
        settings: { customerId }
      })

      expect(responses.length).toEqual(3)
      expect(nock.isDone()).toBe(true)
    })

    it('track event MISSING the membership boolean is routed as an add (syncMode mirror, flag on)', async () => {
      mockPerformChain('create')

      const event = createTestEvent({
        timestamp,
        type: 'track',
        event: NEUTRAL_EVENT,
        context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
        properties: { ...contactInfo } // no my_step boolean
      })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: { ...trackMapping, __segment_internal_sync_mode: 'mirror' },
        settings: { customerId },
        features: { [LEGACY_JOURNEYS_FLAG]: true }
      })

      expect(responses.length).toEqual(3)
      expect(nock.isDone()).toBe(true)
    })

    it('identify event MISSING the membership boolean is routed as an add (flag on)', async () => {
      mockPerformChain('create')

      const event = createTestEvent({
        timestamp,
        type: 'identify',
        event: NEUTRAL_EVENT,
        context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
        traits: { ...contactInfo } // no my_step boolean
      })

      const responses = await testDestination.testAction('userList', {
        event,
        mapping: { ...identifyMapping, __segment_internal_sync_mode: 'mirror' },
        settings: { customerId },
        features: { [LEGACY_JOURNEYS_FLAG]: true }
      })

      expect(responses.length).toEqual(3)
      expect(nock.isDone()).toBe(true)
    })
  })

  describe('performBatch() - computation_class: audience', () => {
    it('routes each event by its own membership boolean (mixed add/remove batch)', async () => {
      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName })

      const capturedOps: Record<string, unknown>[] = []
      // Two addOperations calls are made: one for the add batch, one for the remove batch.
      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:addOperations`)
        .post(/.*/, (body: Record<string, unknown>) => {
          capturedOps.push(...(body.operations as Record<string, unknown>[]))
          return true
        })
        .twice()
        .reply(200, {})

      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:run`).post(/.*/).reply(200, { done: true })

      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          type: 'track',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { ...contactInfo, email: 'add@gmail.com', my_audience: true }
        }),
        createTestEvent({
          timestamp,
          type: 'track',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          properties: { ...contactInfo, email: 'remove@gmail.com', my_audience: false }
        })
      ]

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: trackMapping,
        settings: { customerId }
      })

      expect(responses[0]).toMatchObject({ status: 200 })
      expect(responses[1]).toMatchObject({ status: 200 })

      // Exactly one create and one remove operation, aligned to each event's membership.
      const createOps = capturedOps.filter((op) => 'create' in op)
      const removeOps = capturedOps.filter((op) => 'remove' in op)
      expect(createOps).toHaveLength(1)
      expect(removeOps).toHaveLength(1)
    })

    it('routes identify events by traits[computation_key]', async () => {
      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName })

      const capturedOps: Record<string, unknown>[] = []
      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:addOperations`)
        .post(/.*/, (body: Record<string, unknown>) => {
          capturedOps.push(...(body.operations as Record<string, unknown>[]))
          return true
        })
        .twice()
        .reply(200, {})

      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:run`).post(/.*/).reply(200, { done: true })

      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          type: 'identify',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: { ...contactInfo, email: 'add@gmail.com', my_audience: true }
        }),
        createTestEvent({
          timestamp,
          type: 'identify',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'audience', computation_key: 'my_audience' } },
          traits: { ...contactInfo, email: 'remove@gmail.com', my_audience: false }
        })
      ]

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: identifyMapping,
        settings: { customerId }
      })

      expect(responses[0]).toMatchObject({ status: 200 })
      expect(responses[1]).toMatchObject({ status: 200 })
      expect(capturedOps.filter((op) => 'create' in op)).toHaveLength(1)
      expect(capturedOps.filter((op) => 'remove' in op)).toHaveLength(1)
    })
  })

  describe('performBatch() - computation_class: journey_step', () => {
    it('events MISSING the membership boolean are all routed as adds (syncMode mirror, flag on)', async () => {
      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName })

      const capturedOps: Record<string, unknown>[] = []
      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:addOperations`)
        .post(/.*/, (body: Record<string, unknown>) => {
          capturedOps.push(...(body.operations as Record<string, unknown>[]))
          return true
        })
        .reply(200, {})

      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:run`).post(/.*/).reply(200, { done: true })

      const events: SegmentEvent[] = [
        createTestEvent({
          timestamp,
          type: 'track',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          properties: { ...contactInfo, email: 'a@gmail.com' } // no my_step boolean
        }),
        createTestEvent({
          timestamp,
          type: 'track',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          properties: { ...contactInfo, email: 'b@gmail.com' } // no my_step boolean
        })
      ]

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: { ...trackMapping, __segment_internal_sync_mode: 'mirror' },
        settings: { customerId },
        features: { [LEGACY_JOURNEYS_FLAG]: true }
      })

      expect(responses[0]).toMatchObject({ status: 200 })
      expect(responses[1]).toMatchObject({ status: 200 })
      expect(capturedOps.filter((op) => 'create' in op)).toHaveLength(2)
      expect(capturedOps.filter((op) => 'remove' in op)).toHaveLength(0)
    })

    it('mixes a resolved-false membership with a missing-boolean fallback (flag on)', async () => {
      nock(`https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}/offlineUserDataJobs:create`)
        .post(/.*/)
        .reply(200, { resourceName })

      const capturedOps: Record<string, unknown>[] = []
      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:addOperations`)
        .post(/.*/, (body: Record<string, unknown>) => {
          capturedOps.push(...(body.operations as Record<string, unknown>[]))
          return true
        })
        .twice()
        .reply(200, {})

      nock(`https://googleads.googleapis.com/${API_VERSION}/${resourceName}:run`).post(/.*/).reply(200, { done: true })

      const events: SegmentEvent[] = [
        // Explicit false => remove
        createTestEvent({
          timestamp,
          type: 'track',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          properties: { ...contactInfo, email: 'remove@gmail.com', my_step: false }
        }),
        // Missing boolean => legacy-journeys fallback => add
        createTestEvent({
          timestamp,
          type: 'track',
          event: NEUTRAL_EVENT,
          context: { personas: { computation_class: 'journey_step', computation_key: 'my_step' } },
          properties: { ...contactInfo, email: 'add@gmail.com' }
        })
      ]

      const responses = await testDestination.executeBatch('userList', {
        events,
        mapping: { ...trackMapping, __segment_internal_sync_mode: 'mirror' },
        settings: { customerId },
        features: { [LEGACY_JOURNEYS_FLAG]: true }
      })

      expect(responses[0]).toMatchObject({ status: 200 })
      expect(responses[1]).toMatchObject({ status: 200 })
      expect(capturedOps.filter((op) => 'create' in op)).toHaveLength(1)
      expect(capturedOps.filter((op) => 'remove' in op)).toHaveLength(1)
    })
  })
})
