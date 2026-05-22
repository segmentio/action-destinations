/**
 * Tests for the syncAudience action.
 *
 * Covers:
 *  - Add path (perform): audienceMembership=true → POST with { identity: ... }
 *  - Remove path (perform): audienceMembership=false → DELETE with identity_id in path
 *  - Phone normalization: non-numeric chars including + are stripped before sending/hashing
 *  - Email normalization: lowercased before sending/hashing
 *  - Batch adds (performBatch): POST with { identities: [...] }
 *  - Batch removes (performBatch): DELETE with comma-separated URL-encoded IDs
 *  - Duplicate identity_id detection
 *  - MultiStatusResponse shape on success and error
 */

import nock from 'nock'
import { createHash } from 'crypto'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination as any)

const MNTN_BASE = 'https://integrations.ex.mountain.com'
const SEGMENT_ID = 'seg-abc-123'
const USER_ID = 'user-123'
const ANON_ID = 'anon-456'
const AUDIENCE_KEY = 'my_audience'
const EMAIL = 'user@example.com'
const PHONE_E164 = '+15556004638'
const PHONE_NORMALIZED = '15556004638' // + and non-numeric stripped
const IP = '9.165.155.19'
const TIMESTAMP = '2026-03-25T10:00:00.000Z'

const TEST_SETTINGS = {
  advertiser_id: 'adv-001',
  api_key: 'test-api-key-secret'
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

// Pull the action directly for testing performBatch without the test harness
const syncAudienceAction = (Destination as any).actions.syncAudience

beforeEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

// ─── perform: add path ────────────────────────────────────────────────────────

describe('syncAudience — perform: add', () => {
  it('sends POST when audienceMembership is true', async () => {
    const scope = nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`)
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        traits: { email: EMAIL, [AUDIENCE_KEY]: true },
        context: {
          ip: IP,
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
  })

  it('sends identity.id, source, and identifiers in POST body', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        traits: { email: EMAIL, [AUDIENCE_KEY]: true },
        context: {
          ip: IP,
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity.id).toBe(USER_ID)
    expect(capturedBody.identity.source).toBe('segment')
    expect(capturedBody.identity.identifiers).toBeDefined()
  })

  it('wraps single-event body in { identity } not { identities }', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        traits: { email: EMAIL, [AUDIENCE_KEY]: true },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity).toBeDefined()
    expect(capturedBody.identities).toBeUndefined()
  })

  it('includes source_time when timestamp is present', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        timestamp: TIMESTAMP,
        traits: { [AUDIENCE_KEY]: true },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: SEGMENT_ID,
        identity_id: USER_ID,
        timestamp: TIMESTAMP
      }
    })

    expect(capturedBody.identity.source_time).toEqual({ rfc3339: TIMESTAMP })
  })
})

// ─── perform: remove path ─────────────────────────────────────────────────────

describe('syncAudience — perform: remove', () => {
  it('sends DELETE when audienceMembership is false', async () => {
    const scope = nock(MNTN_BASE)
      .delete(`/v2026/audience/segments/${SEGMENT_ID}/identities/${USER_ID}`)
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        traits: { [AUDIENCE_KEY]: false },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
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

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: undefined,
        anonymousId: ANON_ID,
        traits: { [AUDIENCE_KEY]: false },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
  })
})

// ─── Phone normalization ──────────────────────────────────────────────────────

describe('syncAudience — phone normalization', () => {
  it('strips + and non-numeric chars from phone before sending and hashing', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        traits: { [AUDIENCE_KEY]: true },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: SEGMENT_ID,
        identity_id: USER_ID,
        phone: PHONE_E164
      }
    })

    const phoneEntry = capturedBody.identity.identifiers.find((id: any) => id.kind === 'phone')
    const hashEntry = capturedBody.identity.identifiers.find((id: any) => id.kind === 'phone_sha256')

    expect(phoneEntry.value).toBe(PHONE_NORMALIZED)
    expect(hashEntry.value).toBe(sha256(PHONE_NORMALIZED))
  })

  it('strips spaces and dashes from phone numbers', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        traits: { [AUDIENCE_KEY]: true },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: SEGMENT_ID,
        identity_id: USER_ID,
        phone: '1 (555) 600-4638'
      }
    })

    const phoneEntry = capturedBody.identity.identifiers.find((id: any) => id.kind === 'phone')
    expect(phoneEntry.value).toBe('15556004638')
  })
})

// ─── Email normalization ──────────────────────────────────────────────────────

describe('syncAudience — email normalization', () => {
  it('lowercases email and hashes the normalized value', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('syncAudience', {
      event: createTestEvent({
        type: 'identify',
        userId: USER_ID,
        traits: { [AUDIENCE_KEY]: true },
        context: {
          personas: {
            computation_class: 'audience',
            computation_key: AUDIENCE_KEY,
            external_audience_id: SEGMENT_ID
          }
        }
      }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: SEGMENT_ID,
        identity_id: USER_ID,
        email: 'User@Example.COM'
      }
    })

    const emailEntry = capturedBody.identity.identifiers.find((id: any) => id.kind === 'email')
    const hashEntry = capturedBody.identity.identifiers.find((id: any) => id.kind === 'email_sha256')

    expect(emailEntry.value).toBe('user@example.com')
    expect(hashEntry.value).toBe(sha256('user@example.com'))
  })
})

// ─── performBatch: adds ───────────────────────────────────────────────────────

describe('syncAudience — performBatch: adds', () => {
  it('sends POST with { identities: [...] } array for batch adds', async () => {
    const mockRequest = jest.fn().mockResolvedValue({ status: 202, data: {} })

    await syncAudienceAction.performBatch(mockRequest, {
      payload: [
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-1',
          email: 'user1@example.com'
        },
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-2',
          email: 'user2@example.com'
        }
      ],
      audienceMembership: [true, true],
      settings: TEST_SETTINGS
    })

    expect(mockRequest).toHaveBeenCalledTimes(1)
    const [url, options] = mockRequest.mock.calls[0]
    expect(url).toContain(`/v2026/audience/segments/${SEGMENT_ID}/identities`)
    expect(options.method).toBe('POST')
    expect(options.json.identities).toHaveLength(2)
    expect(options.json.identity).toBeUndefined()
  })

  it('returns MultiStatusResponse with 202 for each added identity', async () => {
    const mockRequest = jest.fn().mockResolvedValue({ status: 202, data: {} })

    const result = await syncAudienceAction.performBatch(mockRequest, {
      payload: [
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-1'
        },
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-2'
        }
      ],
      audienceMembership: [true, true],
      settings: TEST_SETTINGS
    })

    expect(result.getResponseAtIndex(0).value().status).toBe(202)
    expect(result.getResponseAtIndex(1).value().status).toBe(202)
  })
})

// ─── performBatch: removes ────────────────────────────────────────────────────

describe('syncAudience — performBatch: removes', () => {
  it('sends DELETE with comma-separated URL-encoded IDs', async () => {
    const mockRequest = jest.fn().mockResolvedValue({ status: 202, data: {} })

    await syncAudienceAction.performBatch(mockRequest, {
      payload: [
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-1'
        },
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-2'
        }
      ],
      audienceMembership: [false, false],
      settings: TEST_SETTINGS
    })

    expect(mockRequest).toHaveBeenCalledTimes(1)
    const [url, options] = mockRequest.mock.calls[0]
    expect(options.method).toBe('DELETE')
    expect(url).toContain('user-1%2Cuser-2')
  })

  it('URL-encodes special characters in identity IDs', async () => {
    const mockRequest = jest.fn().mockResolvedValue({ status: 202, data: {} })

    await syncAudienceAction.performBatch(mockRequest, {
      payload: [
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user@example.com'
        }
      ],
      audienceMembership: [false],
      settings: TEST_SETTINGS
    })

    const [url] = mockRequest.mock.calls[0]
    expect(url).toContain(encodeURIComponent('user@example.com'))
  })
})

// ─── performBatch: mixed ─────────────────────────────────────────────────────

describe('syncAudience — performBatch: mixed', () => {
  it('sends separate POST and DELETE for mixed add/remove in same segment', async () => {
    const mockRequest = jest.fn().mockResolvedValue({ status: 202, data: {} })

    await syncAudienceAction.performBatch(mockRequest, {
      payload: [
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-add'
        },
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-remove'
        }
      ],
      audienceMembership: [true, false],
      settings: TEST_SETTINGS
    })

    expect(mockRequest).toHaveBeenCalledTimes(2)
    const methods = mockRequest.mock.calls.map(([, opts]) => opts.method)
    expect(methods).toContain('POST')
    expect(methods).toContain('DELETE')
  })

  it('returns error responses in MultiStatusResponse when API fails', async () => {
    const mockRequest = jest.fn().mockRejectedValue(
      Object.assign(new Error('Service Unavailable'), { response: { status: 503 } })
    )

    const result = await syncAudienceAction.performBatch(mockRequest, {
      payload: [
        {
          segment_id: SEGMENT_ID,
          identity_id: 'user-1'
        }
      ],
      audienceMembership: [true],
      settings: TEST_SETTINGS
    })

    expect(result.getResponseAtIndex(0).value().status).toBe(503)
  })
})

// ─── performBatch: duplicate detection ───────────────────────────────────────

describe('syncAudience — performBatch: duplicate detection', () => {
  it('marks duplicate identity_id entries as errors and only sends unique identities', async () => {
    const mockRequest = jest.fn().mockResolvedValue({ status: 202, data: {} })

    const result = await syncAudienceAction.performBatch(mockRequest, {
      payload: [
        { segment_id: SEGMENT_ID, identity_id: 'user-1', email: 'a@example.com' },
        { segment_id: SEGMENT_ID, identity_id: 'user-1', email: 'b@example.com' },
        { segment_id: SEGMENT_ID, identity_id: 'user-2', email: 'c@example.com' }
      ],
      audienceMembership: [true, true, true],
      settings: TEST_SETTINGS
    })

    expect(result.getResponseAtIndex(0).value().status).toBe(202)
    expect(result.getResponseAtIndex(1).value().status).toBe(400)
    expect(result.getResponseAtIndex(1).value().errormessage).toMatch(/duplicate identity_id/i)
    expect(result.getResponseAtIndex(2).value().status).toBe(202)

    expect(mockRequest).toHaveBeenCalledTimes(1)
    const [, options] = mockRequest.mock.calls[0]
    expect(options.json.identities).toHaveLength(2)
  })
})
