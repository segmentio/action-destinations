/**
 * Tests for destination-level configuration:
 *  - testAuthentication: success and failure
 *  - createAudience: creates a new segment, reuses pre-configured segment_id
 *  - getAudience: verifies segment exists, handles 404
 *
 * audienceConfig functions are tested directly by calling them with a
 * jest.fn() mock for the `request` argument, so we can inspect call args
 * and control responses without spinning up a real HTTP server.
 */

import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'

const testDestination = createTestIntegration(Destination as any)

const MNTN_BASE = 'https://integrations.ex.mountain.com'
const TEST_SETTINGS = {
  advertiser_id: 'adv-001',
  api_key: 'test-api-key-secret'
}

// Pull the audienceConfig functions off the destination definition directly
// so we can unit-test them with a mock request client.
const { createAudience, getAudience } = (Destination as any).audienceConfig!

beforeEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

// ─── testAuthentication ───────────────────────────────────────────────────────

describe('testAuthentication', () => {
  it('succeeds when the API responds 200 to GET /v2026/audience/segments?limit=1', async () => {
    nock(MNTN_BASE, {
      reqheaders: { authorization: `Bearer ${TEST_SETTINGS.api_key}` }
    })
      .get('/v2026/audience/segments')
      .query({ limit: '1' })
      .reply(200, { segments: [] })

    await expect(
      testDestination.testAuthentication(TEST_SETTINGS)
    ).resolves.not.toThrow()
  })

  it('throws an IntegrationError when the API responds 401', async () => {
    nock(MNTN_BASE)
      .get('/v2026/audience/segments')
      .query({ limit: '1' })
      .reply(401, { error: { code: 'Unauthenticated', detail: 'API key not found.' } })

    await expect(
      testDestination.testAuthentication(TEST_SETTINGS)
    ).rejects.toThrow(/invalid or does not exist/i)
  })
})

// ─── createAudience ───────────────────────────────────────────────────────────

describe('createAudience', () => {
  it('POSTs to /v2026/audience/segments and returns the new segment ID as externalId', async () => {
    const newSegmentId = 'mntn-generated-id-abc'

    const mockRequest = jest.fn().mockResolvedValue({
      json: () =>
        Promise.resolve({
          segment: { id: newSegmentId, name: 'High Value Users' }
        })
    })

    const result = await createAudience(mockRequest, {
      audienceName: 'High Value Users',
      settings: TEST_SETTINGS,
      audienceSettings: {}
    })

    expect(result).toEqual({ externalId: newSegmentId })
    expect(mockRequest).toHaveBeenCalledWith(
      `${MNTN_BASE}/v2026/audience/segments`,
      expect.objectContaining({
        method: 'POST',
        json: { segment: { name: 'High Value Users' } }
      })
    )
  })

  it('uses a pre-configured segment_id without calling the API', async () => {
    const preExistingId = 'pre-existing-seg-001'
    const mockRequest = jest.fn()

    const result = await createAudience(mockRequest, {
      audienceName: 'My Audience',
      settings: TEST_SETTINGS,
      audienceSettings: { segment_id: preExistingId }
    })

    expect(result).toEqual({ externalId: preExistingId })
    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('throws PayloadValidationError when audienceName is missing and no segment_id configured', async () => {
    const mockRequest = jest.fn()

    await expect(
      createAudience(mockRequest, {
        audienceName: '',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/missing audience name/i)

    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('throws an IntegrationError if the API response has no segment.id', async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ segment: {} }) // id is missing
    })

    await expect(
      createAudience(mockRequest, {
        audienceName: 'Broken Audience',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/unexpected response/i)
  })
})

// ─── getAudience ──────────────────────────────────────────────────────────────

describe('getAudience', () => {
  it('GETs the segment by externalId and returns it', async () => {
    const segmentId = 'existing-seg-abc'

    const mockRequest = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          segment: { id: segmentId, name: 'Test Audience' }
        })
    })

    const result = await getAudience(mockRequest, {
      externalId: segmentId,
      settings: TEST_SETTINGS,
      audienceSettings: {}
    })

    expect(result).toEqual({ externalId: segmentId })
    expect(mockRequest).toHaveBeenCalledWith(
      `${MNTN_BASE}/v2026/audience/segments/${encodeURIComponent(segmentId)}`,
      expect.objectContaining({ method: 'GET' })
    )
  })

  it('prefers audienceSettings.segment_id over externalId when both are present', async () => {
    const overrideId = 'override-seg-999'

    const mockRequest = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ segment: { id: overrideId } })
    })

    const result = await getAudience(mockRequest, {
      externalId: 'stale-id',
      settings: TEST_SETTINGS,
      audienceSettings: { segment_id: overrideId }
    })

    expect(result).toEqual({ externalId: overrideId })
    expect(mockRequest).toHaveBeenCalledWith(
      `${MNTN_BASE}/v2026/audience/segments/${encodeURIComponent(overrideId)}`,
      expect.anything()
    )
  })

  it('throws IntegrationError with SEGMENT_NOT_FOUND when API returns 404', async () => {
    const missingId = 'does-not-exist'

    const mockRequest = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          error: { code: 'SegmentNotFound', detail: 'Not found.' }
        })
    })

    await expect(
      getAudience(mockRequest, {
        externalId: missingId,
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/was not found/i)
  })

  it('throws an IntegrationError when neither externalId nor segment_id is provided', async () => {
    const mockRequest = jest.fn()

    await expect(
      getAudience(mockRequest, {
        externalId: '',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/no mntn segment id found/i)

    expect(mockRequest).not.toHaveBeenCalled()
  })

  it('throws IntegrationError for unexpected non-404 errors', async () => {
    const mockRequest = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({})
    })

    await expect(
      getAudience(mockRequest, {
        externalId: 'seg-abc',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/unexpected error/i)
  })
})
