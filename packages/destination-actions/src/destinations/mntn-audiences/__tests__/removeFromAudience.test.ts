/**
 * Tests for the removeFromAudience action.
 *
 * Covers:
 *  - Correct DELETE URL (segment_id + identity_id in path)
 *  - Uses userId as identity_id when present
 *  - Falls back to anonymousId when userId is absent
 *  - Special characters in IDs are URL-encoded
 *  - Authorization header is forwarded
 */

import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination as any)

const MNTN_BASE = 'https://integrations.ex.mountain.com'
const SEGMENT_ID = 'seg-abc-123'
const USER_ID = 'user-123'
const ANON_ID = 'anon-456'

const TEST_SETTINGS = {
  advertiser_id: 'adv-001',
  api_key: 'test-api-key-secret'
}

beforeEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

// ─── DELETE URL construction ───────────────────────────────────────────────────

describe('removeFromAudience — DELETE URL', () => {
  it('sends DELETE to /v2026/audience/segments/{segment_id}/identities/{identity_id}', async () => {
    const scope = nock(MNTN_BASE)
      .delete(`/v2026/audience/segments/${SEGMENT_ID}/identities/${USER_ID}`)
      .reply(202, {})

    const responses = await testDestination.testAction('removeFromAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Exited',
        userId: USER_ID,
        anonymousId: ANON_ID,
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
    expect(responses[0].status).toBe(202)
  })

  it('uses the correct Authorization header', async () => {
    nock(MNTN_BASE, {
      reqheaders: { authorization: `Bearer ${TEST_SETTINGS.api_key}` }
    })
      .delete(`/v2026/audience/segments/${SEGMENT_ID}/identities/${USER_ID}`)
      .reply(202, {})

    const responses = await testDestination.testAction('removeFromAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Exited',
        userId: USER_ID,
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(202)
  })
})

// ─── identity_id resolution ────────────────────────────────────────────────────

describe('removeFromAudience — identity_id', () => {
  it('uses userId when present', async () => {
    const scope = nock(MNTN_BASE)
      .delete(`/v2026/audience/segments/${SEGMENT_ID}/identities/${USER_ID}`)
      .reply(202, {})

    await testDestination.testAction('removeFromAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Exited',
        userId: USER_ID,
        anonymousId: ANON_ID,
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
  })

  it('falls back to anonymousId when userId is absent', async () => {
    const scope = nock(MNTN_BASE)
      .delete(`/v2026/audience/segments/${SEGMENT_ID}/identities/${ANON_ID}`)
      .reply(202, {})

    await testDestination.testAction('removeFromAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Exited',
        userId: undefined,
        anonymousId: ANON_ID,
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
  })
})

// ─── URL encoding ─────────────────────────────────────────────────────────────

describe('removeFromAudience — URL encoding', () => {
  it('URL-encodes special characters in identity_id', async () => {
    const specialId = 'user@example.com'
    const encodedId = encodeURIComponent(specialId) // 'user%40example.com'

    const scope = nock(MNTN_BASE)
      .delete(`/v2026/audience/segments/${SEGMENT_ID}/identities/${encodedId}`)
      .reply(202, {})

    await testDestination.testAction('removeFromAudience', {
      event: createTestEvent({ type: 'track', event: 'Audience Exited' }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: SEGMENT_ID,
        identity_id: specialId
      }
    })

    expect(scope.isDone()).toBe(true)
  })

  it('URL-encodes special characters in segment_id', async () => {
    const specialSegmentId = 'seg/with spaces'
    const encodedSegmentId = encodeURIComponent(specialSegmentId)

    const scope = nock(MNTN_BASE)
      .delete(`/v2026/audience/segments/${encodedSegmentId}/identities/${USER_ID}`)
      .reply(202, {})

    await testDestination.testAction('removeFromAudience', {
      event: createTestEvent({ type: 'track', event: 'Audience Exited' }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: specialSegmentId,
        identity_id: USER_ID
      }
    })

    expect(scope.isDone()).toBe(true)
  })
})

// ─── segment_id from personas ─────────────────────────────────────────────────

describe('removeFromAudience — segment_id', () => {
  it('routes to the correct segment from context.personas.external_audience_id', async () => {
    const otherSegmentId = 'other-seg-789'

    const scope = nock(MNTN_BASE)
      .delete(`/v2026/audience/segments/${otherSegmentId}/identities/${USER_ID}`)
      .reply(202, {})

    await testDestination.testAction('removeFromAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Exited',
        userId: USER_ID,
        context: { personas: { external_audience_id: otherSegmentId } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
  })
})
