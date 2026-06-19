import nock from 'nock'
import { createTestEvent, createTestIntegration, RetryableError } from '@segment/actions-core'
import type { SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { REGIONS, SEGMENT_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const settings = {
  integrationKey: 'test-integration-key',
  region: REGIONS.DEFAULT.name
}

const SEGMENT_ID = 'seg-abc123'
const segmentBase = `/${SEGMENT_ENDPOINT}/${SEGMENT_ID}`

function makeEvent(userId: string, audienceValue: boolean, type: 'identify' | 'track' = 'identify'): SegmentEvent {
  return createTestEvent({
    type,
    userId,
    traits: type === 'identify' ? { test_audience: audienceValue } : undefined,
    properties: type === 'track' ? { test_audience: audienceValue } : undefined,
    context: {
      personas: {
        computation_class: 'audience',
        computation_key: 'test_audience',
        external_audience_id: SEGMENT_ID
      }
    }
  })
}

const baseMapping = {
  visitorId: { '@path': '$.userId' },
  segmentAudienceId: SEGMENT_ID,
  enable_batching: false
}

describe('Pendo Audiences - syncAudience', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  const batchMapping = { ...baseMapping, enable_batching: true }

  describe('executeBatch - all adds', () => {
    it('should PATCH with a single add operation and return a full response per visitor', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'add', path: '/visitors', value: ['user1', 'user2', 'user3'] }]
      }

      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'add' }] })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', true), makeEvent('user3', true)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(3)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user2'] }] }
      })
      expect(responses[2]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user3', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user3'] }] }
      })
    })
  })

  describe('executeBatch - all removes', () => {
    it('should PATCH with a single remove operation and return a full response per visitor', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'remove', path: '/visitors', value: ['user1', 'user2'] }]
      }

      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'remove' }] })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', false), makeEvent('user2', false)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'remove', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] }
      })
    })
  })

  describe('executeBatch - mixed adds and removes', () => {
    it('should PATCH with both add and remove operations and return a full response per visitor', async () => {
      const expectedPatchJSON = {
        patch: [
          { op: 'add', path: '/visitors', value: ['user1', 'user3'] },
          { op: 'remove', path: '/visitors', value: ['user2', 'user4'] }
        ]
      }

      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, {
          multistatus: [
            { status: 200, message: 'success', operation: 'add' },
            { status: 200, message: 'success', operation: 'remove' }
          ]
        })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false), makeEvent('user3', true), makeEvent('user4', false)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(4)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] }
      })
      expect(responses[2]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user3', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user3'] }] }
      })
      expect(responses[3]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user4', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'remove', path: '/visitors', value: ['user4'] }] }
      })
    })
  })

  describe('executeBatch - track events', () => {
    it('should resolve membership from track event properties and PATCH add/remove accordingly', async () => {
      const expectedPatchJSON = {
        patch: [
          { op: 'add', path: '/visitors', value: ['user1'] },
          { op: 'remove', path: '/visitors', value: ['user2'] }
        ]
      }

      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, {
          multistatus: [
            { status: 200, message: 'success', operation: 'add' },
            { status: 200, message: 'success', operation: 'remove' }
          ]
        })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true, 'track'), makeEvent('user2', false, 'track')],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] }
      })
    })

    it('should return a 400 error for a track event with no membership in properties', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'add', path: '/visitors', value: ['user1'] }]
      }

      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'add' }] })

      const events: SegmentEvent[] = [
        makeEvent('user1', true, 'track'),
        createTestEvent({
          type: 'track',
          event: 'Audience Entered',
          userId: 'user2',
          properties: {}, // computation_key missing from properties → membership undeterminable
          context: {
            personas: { computation_class: 'audience', computation_key: 'test_audience', external_audience_id: SEGMENT_ID }
          }
        })
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errormessage: 'Unable to determine audience membership for this event',
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true }
      })
      expect(responses[1]).not.toHaveProperty('body')
    })
  })

  describe('executeBatch - validation errors', () => {
    it('should return a schema error for a payload with undefined visitorId and succeed for the valid one', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'add', path: '/visitors', value: ['user1'] }]
      }

      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'add' }] })

      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'identify',
          userId: 'user1',
          traits: { test_audience: true, customId: 'user1' },
          context: {
            personas: { computation_class: 'audience', computation_key: 'test_audience', external_audience_id: SEGMENT_ID }
          }
        }),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          traits: { test_audience: true }, // no customId → visitorId resolves to undefined
          context: {
            personas: { computation_class: 'audience', computation_key: 'test_audience', external_audience_id: SEGMENT_ID }
          }
        })
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings,
        mapping: { ...batchMapping, visitorId: { '@path': '$.traits.customId' } }
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'visitorId'."
      })
    })

    it('should return a 400 error for all payloads when visitorId is empty string', async () => {
      // Empty strings survive schema validation (required only rejects undefined/null) and
      // reach our custom if(!visitorId) guard in send
      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true)],
        settings,
        mapping: { ...batchMapping, visitorId: '' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0]).toMatchObject({
        status: 400,
        errormessage: 'Visitor ID is required',
        sent: { visitorId: '', segmentAudienceId: SEGMENT_ID, enable_batching: true }
      })
      // Validation error never reached Pendo, so no request body was sent to the destination
      expect(responses[0]).not.toHaveProperty('body')
    })

    it('should return a 400 error for all payloads when segmentAudienceId is empty string', async () => {
      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false)],
        settings,
        mapping: { ...batchMapping, segmentAudienceId: '' }
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 400,
        errormessage: 'Missing Pendo Segment ID',
        sent: { visitorId: 'user1', segmentAudienceId: '', enable_batching: true }
      })
      expect(responses[0]).not.toHaveProperty('body')
      expect(responses[1]).toMatchObject({
        status: 400,
        errormessage: 'Missing Pendo Segment ID',
        sent: { visitorId: 'user2', segmentAudienceId: '', enable_batching: true }
      })
      expect(responses[1]).not.toHaveProperty('body')
    })

    it('should return a schema error for all payloads when segmentAudienceId is missing', async () => {
      // No nock mock needed — performBatch is never called when all payloads fail schema validation
      // Omit segmentAudienceId entirely so the field is absent and fails schema validation
      const { segmentAudienceId, ...mappingWithoutSegmentId } = batchMapping
      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false)],
        settings,
        mapping: mappingWithoutSegmentId
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'segmentAudienceId'."
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'segmentAudienceId'."
      })
    })

    it('should return a 400 error when audience membership cannot be determined', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'add', path: '/visitors', value: ['user1'] }]
      }

      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'add' }] })

      const events: SegmentEvent[] = [
        makeEvent('user1', true),
        createTestEvent({
          type: 'identify',
          userId: 'user2',
          // computation_class is not "audience", so core cannot resolve membership for this event
          context: { personas: { computation_key: 'test_audience', external_audience_id: SEGMENT_ID } }
        })
      ]

      const responses = await testDestination.executeBatch('syncAudience', {
        events,
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errormessage: 'Unable to determine audience membership for this event',
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true }
      })
      expect(responses[1]).not.toHaveProperty('body')
    })
  })

  describe('executeBatch - API error handling', () => {
    it('should return a 500 error for all payloads when the API returns 500', async () => {
      nock(REGIONS.DEFAULT.domain).patch(`${segmentBase}/visitor`).reply(500, { message: 'Internal Server Error' })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', true)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 500,
        errormessage: 'Internal Server Error',
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 500,
        errormessage: 'Internal Server Error',
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user2'] }] }
      })
    })

    it('should return a 403 error for all payloads when the API returns 403', async () => {
      nock(REGIONS.DEFAULT.domain).patch(`${segmentBase}/visitor`).reply(403, { message: 'Forbidden' })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 403,
        errormessage: 'Forbidden',
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 403,
        errormessage: 'Forbidden',
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] }
      })
    })

    it('should return per-operation errors when Pendo multistatus reports add failure but remove success', async () => {
      nock(REGIONS.DEFAULT.domain)
        .patch(`${segmentBase}/visitor`)
        .reply(200, {
          multistatus: [
            { status: 400, message: 'Error adding visitor to segment', operation: 'add' },
            { status: 200, message: 'success', operation: 'remove' }
          ]
        })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 400,
        errormessage: 'Error adding visitor to segment',
        sent: { visitorId: 'user1', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { visitorId: 'user2', segmentAudienceId: SEGMENT_ID, enable_batching: true },
        body: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] }
      })
    })

    it('should throw a RetryableError (429) for the whole batch when the API returns 409', async () => {
      // 409 is transient ("operation in progress"); the entire PATCH failed, so we retry the whole
      // batch by throwing rather than marking individual items as failed.
      nock(REGIONS.DEFAULT.domain).patch(`${segmentBase}/visitor`).reply(409, { message: 'Conflict' })

      const promise = testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false)],
        settings,
        mapping: batchMapping
      })

      await expect(promise).rejects.toThrow(RetryableError)
      await expect(promise).rejects.toThrow('Pendo returned a 409. Segment is returning a 429 to trigger a retry.')
      await expect(promise).rejects.toMatchObject({ status: 429, code: 'RETRYABLE_ERROR' })
    })
  })
})
