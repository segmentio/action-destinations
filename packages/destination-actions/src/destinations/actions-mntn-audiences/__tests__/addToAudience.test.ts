/**
 * Tests for the addToAudience action.
 *
 * Covers:
 *  - Correct POST URL and body structure
 *  - SHA-256 hashing of email and phone
 *  - Only present identifiers are included
 *  - source_time is included when timestamp is present, omitted when absent
 *  - Falls back to anonymousId when userId is missing
 *  - segment_id is sourced from context.personas.external_audience_id
 *  - At least one identifier is required
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
const EMAIL = 'user@example.com'
const PHONE = '+15556004638'
const IP = '9.165.155.19'
const MAID = '3f097372-f01e-4b64-984c-395ae5828ee6'
const TIMESTAMP = '2026-03-25T10:00:00.000Z'

const TEST_SETTINGS = {
  advertiser_id: 'adv-001',
  api_key: 'test-api-key-secret'
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

beforeEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

// ─── Happy path: all identity signals ────────────────────────────────────────

describe('addToAudience — request structure', () => {
  it('sends a POST to the correct URL with all identity signals present', async () => {
    const scope = nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`)
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        anonymousId: ANON_ID,
        timestamp: TIMESTAMP,
        traits: { email: EMAIL, phone: PHONE },
        context: {
          ip: IP,
          personas: { external_audience_id: SEGMENT_ID },
          device: { advertisingId: MAID }
        }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
  })

  it('uses the Authorization: Bearer header from extendRequest', async () => {
    nock(MNTN_BASE, {
      reqheaders: { authorization: `Bearer ${TEST_SETTINGS.api_key}` }
    })
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`)
      .reply(202, {})

    const responses = await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(responses[0].status).toBe(202)
  })
})

// ─── Identity ID ─────────────────────────────────────────────────────────────

describe('addToAudience — identity_id', () => {
  it('uses userId as identity.id when present', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        anonymousId: ANON_ID,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity.id).toBe(USER_ID)
  })

  it('falls back to anonymousId when userId is absent', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: undefined,
        anonymousId: ANON_ID,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity.id).toBe(ANON_ID)
  })
})

// ─── Source metadata ──────────────────────────────────────────────────────────

describe('addToAudience — source metadata', () => {
  it('sets identity.source to "segment"', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity.source).toBe('segment')
  })

  it('includes source_time.rfc3339 when timestamp is present', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        timestamp: TIMESTAMP,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity.source_time).toEqual({ rfc3339: TIMESTAMP })
  })

  it('omits source_time when timestamp is absent', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    // Explicitly provide no timestamp via mapping override
    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: SEGMENT_ID,
        identity_id: USER_ID,
        email: EMAIL,
        timestamp: undefined
      }
    })

    expect(capturedBody.identity.source_time).toBeUndefined()
  })
})

// ─── SHA-256 hashing ──────────────────────────────────────────────────────────

describe('addToAudience — SHA-256 hashing', () => {
  it('sends both plaintext and SHA-256 hashed email', async () => {
    let capturedBody: any
    const normalizedEmail = EMAIL.toLowerCase().trim()

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity.identifiers).toContainEqual({
      kind: 'email',
      value: normalizedEmail
    })
    expect(capturedBody.identity.identifiers).toContainEqual({
      kind: 'email_sha256',
      value: sha256(normalizedEmail)
    })
  })

  it('normalizes email to lowercase before hashing', async () => {
    let capturedBody: any
    const mixedCaseEmail = 'User@Example.COM'
    const normalized = 'user@example.com'

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      mapping: {
        segment_id: SEGMENT_ID,
        identity_id: USER_ID,
        email: mixedCaseEmail
      }
    })

    const emailEntry = capturedBody.identity.identifiers.find(
      (id: { kind: string }) => id.kind === 'email'
    )
    const hashEntry = capturedBody.identity.identifiers.find(
      (id: { kind: string }) => id.kind === 'email_sha256'
    )

    expect(emailEntry.value).toBe(normalized)
    expect(hashEntry.value).toBe(sha256(normalized))
  })

  it('sends both plaintext and SHA-256 hashed phone', async () => {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        traits: { phone: PHONE },
        context: { personas: { external_audience_id: SEGMENT_ID } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(capturedBody.identity.identifiers).toContainEqual({
      kind: 'phone',
      value: PHONE
    })
    expect(capturedBody.identity.identifiers).toContainEqual({
      kind: 'phone_sha256',
      value: sha256(PHONE)
    })
  })
})

// ─── Partial identifier sets ──────────────────────────────────────────────────

describe('addToAudience — partial identifier sets', () => {
  async function captureIdentifiers(mapping: Record<string, unknown>) {
    let capturedBody: any

    nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${SEGMENT_ID}/identities`, (body) => {
        capturedBody = body
        return true
      })
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({ type: 'track', event: 'Audience Entered' }),
      settings: TEST_SETTINGS,
      mapping: { segment_id: SEGMENT_ID, identity_id: USER_ID, ...mapping }
    })

    return capturedBody.identity.identifiers as Array<{ kind: string; value: string }>
  }

  it('sends only ipv4 when only ip is provided', async () => {
    const ids = await captureIdentifiers({ ip: IP })
    expect(ids).toHaveLength(1)
    expect(ids[0]).toEqual({ kind: 'ipv4', value: IP })
  })

  it('sends only maid when only maid is provided', async () => {
    const ids = await captureIdentifiers({ maid: MAID })
    expect(ids).toHaveLength(1)
    expect(ids[0]).toEqual({ kind: 'maid', value: MAID })
  })

  it('sends email + email_sha256 + ipv4 when email and ip are provided', async () => {
    const ids = await captureIdentifiers({ email: EMAIL, ip: IP })
    const kinds = ids.map((id) => id.kind)
    expect(kinds).toContain('email')
    expect(kinds).toContain('email_sha256')
    expect(kinds).toContain('ipv4')
    expect(kinds).not.toContain('phone')
    expect(kinds).not.toContain('maid')
  })

  it('sends all 6 identifier entries when all signals are provided', async () => {
    const ids = await captureIdentifiers({ email: EMAIL, phone: PHONE, ip: IP, maid: MAID })
    const kinds = ids.map((id) => id.kind)
    expect(kinds).toEqual(
      expect.arrayContaining(['email', 'email_sha256', 'phone', 'phone_sha256', 'ipv4', 'maid'])
    )
    expect(ids).toHaveLength(6)
  })
})

// ─── segment_id routing ───────────────────────────────────────────────────────

describe('addToAudience — segment_id', () => {
  it('routes to the correct segment ID from context.personas.external_audience_id', async () => {
    const customSegmentId = 'custom-segment-999'

    const scope = nock(MNTN_BASE)
      .post(`/v2026/audience/segments/${customSegmentId}/identities`)
      .reply(202, {})

    await testDestination.testAction('addToAudience', {
      event: createTestEvent({
        type: 'track',
        event: 'Audience Entered',
        userId: USER_ID,
        traits: { email: EMAIL },
        context: { personas: { external_audience_id: customSegmentId } }
      }),
      settings: TEST_SETTINGS,
      useDefaultMappings: true
    })

    expect(scope.isDone()).toBe(true)
  })
})
