import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import type { SegmentEvent } from '@segment/actions-core'
import Destination from '../../index'
import { CONSTANTS } from '../../constants'

const testDestination = createTestIntegration(Destination)

const settings = {
  integrationKey: 'test-integration-key'
}

const SEGMENT_ID = 'seg-abc123'
const segmentBase = `${CONSTANTS.SEGMENT_ENDPOINT}/${SEGMENT_ID}`

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
  traitsOrProperties: { '@path': '$.traits' },
  segmentAudienceKey: 'test_audience',
  segmentAudienceId: SEGMENT_ID,
  enable_batching: false
}

describe('Pendo Audiences - syncAudience', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  // ─── perform (single events) ─────────────────────────────────────────────

  describe('perform - add visitor (PUT)', () => {
    it('should PUT to add a visitor when audience value is true', async () => {
      nock(CONSTANTS.API_BASE_URL).put(`${segmentBase}/visitor/user1`).reply(200, { message: 'success' })

      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent('user1', true),
          settings,
          mapping: baseMapping
        })
      ).resolves.not.toThrowError()
    })

    it('should URL-encode special characters in visitorId', async () => {
      nock(CONSTANTS.API_BASE_URL)
        .put(`${segmentBase}/visitor/user%40example.com`)
        .reply(200, { message: 'success' })

      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent('user@example.com', true),
          settings,
          mapping: { ...baseMapping, visitorId: 'user@example.com' }
        })
      ).resolves.not.toThrowError()
    })

    it('should work for track events', async () => {
      nock(CONSTANTS.API_BASE_URL).put(`${segmentBase}/visitor/user1`).reply(200, { message: 'success' })

      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent('user1', true, 'track'),
          settings,
          mapping: {
            ...baseMapping,
            traitsOrProperties: { '@path': '$.properties' }
          }
        })
      ).resolves.not.toThrowError()
    })
  })

  describe('perform - remove visitor (DELETE)', () => {
    it('should DELETE to remove a visitor when audience value is false', async () => {
      nock(CONSTANTS.API_BASE_URL).delete(`${segmentBase}/visitor/user1`).reply(200, { message: 'success' })

      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent('user1', false),
          settings,
          mapping: baseMapping
        })
      ).resolves.not.toThrowError()
    })
  })

  describe('perform - validation errors', () => {
    it('should throw when visitorId is missing', async () => {
      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent('user1', true),
          settings,
          mapping: { ...baseMapping, visitorId: undefined }
        })
      ).rejects.toThrowError()
    })

    it('should throw when segmentAudienceId is missing', async () => {
      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent('user1', true),
          settings,
          mapping: { ...baseMapping, segmentAudienceId: undefined }
        })
      ).rejects.toThrowError()
    })
  })

  describe('perform - API error handling', () => {

    it('should throw IntegrationError on 404 Not Found', async () => {
      nock(CONSTANTS.API_BASE_URL).put(`${segmentBase}/visitor/user1`).reply(404, { message: 'Not Found' })

      await expect(
        testDestination.testAction('syncAudience', {
          event: makeEvent('user1', true),
          settings,
          mapping: baseMapping
        })
      ).rejects.toThrowError()
    })

  })

  // ─── executeBatch ─────────────────────────────────────────────────────────

  const batchMapping = { ...baseMapping, enable_batching: true }

  describe('executeBatch - all adds', () => {
    it('should PATCH with a single add operation and return a full response per visitor', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'add', path: '/visitors', value: ['user1', 'user2', 'user3'] }]
      }

      nock(CONSTANTS.API_BASE_URL)
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
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] },
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user2'] }] },
        body: { visitorId: 'user2', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[2]).toMatchObject({
        status: 200,
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user3'] }] },
        body: { visitorId: 'user3', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
    })
  })

  describe('executeBatch - all removes', () => {
    it('should PATCH with a single remove operation and return a full response per visitor', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'remove', path: '/visitors', value: ['user1', 'user2'] }]
      }

      nock(CONSTANTS.API_BASE_URL)
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
        sent: { patch: [{ op: 'remove', path: '/visitors', value: ['user1'] }] },
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: false }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] },
        body: { visitorId: 'user2', traitsOrProperties: { test_audience: false }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
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

      nock(CONSTANTS.API_BASE_URL)
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
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] },
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] },
        body: { visitorId: 'user2', traitsOrProperties: { test_audience: false }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[2]).toMatchObject({
        status: 200,
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user3'] }] },
        body: { visitorId: 'user3', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[3]).toMatchObject({
        status: 200,
        sent: { patch: [{ op: 'remove', path: '/visitors', value: ['user4'] }] },
        body: { visitorId: 'user4', traitsOrProperties: { test_audience: false }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
    })
  })

  describe('executeBatch - validation errors', () => {
    it('should return a schema error for a payload with undefined visitorId and succeed for the valid one', async () => {
      const expectedPatchJSON = {
        patch: [{ op: 'add', path: '/visitors', value: ['user1'] }]
      }

      nock(CONSTANTS.API_BASE_URL)
        .patch(`${segmentBase}/visitor`, expectedPatchJSON)
        .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'add' }] })

      const events: SegmentEvent[] = [
        createTestEvent({
          userId: 'user1',
          traits: { test_audience: true, customId: 'user1' },
          context: { personas: { computation_key: 'test_audience', external_audience_id: SEGMENT_ID } }
        }),
        createTestEvent({
          userId: 'user2',
          traits: { test_audience: true }, // no customId → visitorId resolves to undefined
          context: { personas: { computation_key: 'test_audience', external_audience_id: SEGMENT_ID } }
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
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] },
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: true, customId: 'user1' }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'visitorId'."
      })
    })

    it('should return a 400 error for all payloads when visitorId is empty string', async () => {
      // Empty strings survive schema validation (required only rejects undefined/null) and
      // reach our custom if(!visitorId) guard in sendBatch
      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true)],
        settings,
        mapping: { ...batchMapping, visitorId: '' }
      })

      expect(responses.length).toBe(1)
      expect(responses[0]).toMatchObject({
        status: 400,
        errormessage: 'Visitor ID is required',
        body: { visitorId: '', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
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
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: '' }
      })
      expect(responses[1]).toMatchObject({
        status: 400,
        errormessage: 'Missing Pendo Segment ID',
        body: { visitorId: 'user2', traitsOrProperties: { test_audience: false }, segmentAudienceKey: 'test_audience', segmentAudienceId: '' }
      })
    })

    it('should return a schema error for all payloads when segmentAudienceId is missing', async () => {
      // No nock mock needed — performBatch is never called when all payloads fail schema validation
      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false)],
        settings,
        mapping: { ...batchMapping, segmentAudienceId: undefined }
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: "The root value is missing the required field 'segmentAudienceId'." })
      expect(responses[1]).toMatchObject({ status: 400, errortype: 'PAYLOAD_VALIDATION_FAILED', errormessage: "The root value is missing the required field 'segmentAudienceId'." })
    })
  })

  describe('executeBatch - API error handling', () => {
    it('should return a 500 error for all payloads when the API returns 500', async () => {
      nock(CONSTANTS.API_BASE_URL).patch(`${segmentBase}/visitor`).reply(500, { message: 'Internal Server Error' })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', true)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 500,
        errormessage: 'Internal Server Error',
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] },
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 500,
        errormessage: 'Internal Server Error',
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user2'] }] },
        body: { visitorId: 'user2', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
    })

    it('should return a 403 error for all payloads when the API returns 403', async () => {
      nock(CONSTANTS.API_BASE_URL).patch(`${segmentBase}/visitor`).reply(403, { message: 'Forbidden' })

      const responses = await testDestination.executeBatch('syncAudience', {
        events: [makeEvent('user1', true), makeEvent('user2', false)],
        settings,
        mapping: batchMapping
      })

      expect(responses.length).toBe(2)
      expect(responses[0]).toMatchObject({
        status: 403,
        errormessage: 'Forbidden',
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] },
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 403,
        errormessage: 'Forbidden',
        sent: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] },
        body: { visitorId: 'user2', traitsOrProperties: { test_audience: false }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
    })

    it('should return per-operation errors when Pendo multistatus reports add failure but remove success', async () => {
      nock(CONSTANTS.API_BASE_URL)
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
        sent: { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] },
        body: { visitorId: 'user1', traitsOrProperties: { test_audience: true }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
      expect(responses[1]).toMatchObject({
        status: 200,
        sent: { patch: [{ op: 'remove', path: '/visitors', value: ['user2'] }] },
        body: { visitorId: 'user2', traitsOrProperties: { test_audience: false }, segmentAudienceKey: 'test_audience', segmentAudienceId: SEGMENT_ID }
      })
    })
  })
})
