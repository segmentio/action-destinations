import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { MNTN_API_VERSION } from '../versioning-info'

const testDestination = createTestIntegration(Destination as any)

const MNTN_BASE = 'https://integrations.ex.mountain.com'
const TEST_SETTINGS = {
  api_key: 'test-api-key-secret'
}

beforeEach(() => {
  nock.cleanAll()
})

afterAll(() => {
  nock.cleanAll()
  nock.restore()
})

// ─── testAuthentication ───────────────────────────────────────────────────────

describe('testAuthentication', () => {
  it('succeeds when the API responds 200', async () => {
    nock(MNTN_BASE, { reqheaders: { authorization: `Bearer ${TEST_SETTINGS.api_key}` } })
      .get(`/${MNTN_API_VERSION}/audience/segments`)
      .query({ limit: '1' })
      .reply(200, { segments: [] })

    await expect(testDestination.testAuthentication(TEST_SETTINGS)).resolves.not.toThrow()
  })

  it('throws when the API responds 401', async () => {
    nock(MNTN_BASE)
      .get(`/${MNTN_API_VERSION}/audience/segments`)
      .query({ limit: '1' })
      .reply(401, { error: { code: 'Unauthenticated' } })

    await expect(testDestination.testAuthentication(TEST_SETTINGS)).rejects.toThrow(/Credentials are invalid: 401/)
  })
})

// ─── createAudience ───────────────────────────────────────────────────────────

describe('createAudience', () => {
  it('POSTs to create a new segment and returns its ID as externalId', async () => {
    nock(MNTN_BASE)
      .post(`/${MNTN_API_VERSION}/audience/segments`, { segment: { name: 'High Value Users' } })
      .reply(200, { segment: { id: 'mntn-new-id', name: 'High Value Users' } })

    const result = await testDestination.createAudience({
      audienceName: 'High Value Users',
      settings: TEST_SETTINGS,
      audienceSettings: {}
    })

    expect(result).toEqual({ externalId: 'mntn-new-id' })
  })

  it('uses pre-configured segment_id without calling the API', async () => {
    const result = await testDestination.createAudience({
      audienceName: 'My Audience',
      settings: TEST_SETTINGS,
      audienceSettings: { segment_id: 'pre-existing-001' }
    })

    expect(result).toEqual({ externalId: 'pre-existing-001' })
  })

  it('throws PayloadValidationError when audienceName is missing and no segment_id configured', async () => {
    await expect(
      testDestination.createAudience({
        audienceName: '',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/missing audience name/i)
  })

  it('throws IntegrationError if the API response has no segment.id', async () => {
    nock(MNTN_BASE).post(`/${MNTN_API_VERSION}/audience/segments`).reply(200, { segment: {} })

    await expect(
      testDestination.createAudience({
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

    nock(MNTN_BASE).get(`/${MNTN_API_VERSION}/audience/segments/${segmentId}`).reply(200, { segment: { id: segmentId } })

    const result = await testDestination.getAudience({
      externalId: segmentId,
      settings: TEST_SETTINGS,
      audienceSettings: {}
    })

    expect(result).toEqual({ externalId: segmentId })
  })

  it('prefers audienceSettings.segment_id over externalId', async () => {
    const overrideId = 'override-seg-999'

    nock(MNTN_BASE).get(`/${MNTN_API_VERSION}/audience/segments/${overrideId}`).reply(200, { segment: { id: overrideId } })

    const result = await testDestination.getAudience({
      externalId: 'stale-id',
      settings: TEST_SETTINGS,
      audienceSettings: { segment_id: overrideId }
    })

    expect(result).toEqual({ externalId: overrideId })
  })

  it('throws when neither externalId nor segment_id is provided', async () => {
    await expect(
      testDestination.getAudience({
        externalId: '',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/no mntn segment id found/i)
  })

  it('throws when the API responds 404', async () => {
    nock(MNTN_BASE).get(`/${MNTN_API_VERSION}/audience/segments/does-not-exist`).reply(404, { error: { code: 'NotFound' } })

    await expect(
      testDestination.getAudience({
        externalId: 'does-not-exist',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow()
  })

  it('throws IntegrationError if the API response has no segment.id', async () => {
    nock(MNTN_BASE).get(`/${MNTN_API_VERSION}/audience/segments/seg-abc`).reply(200, { segment: {} })

    await expect(
      testDestination.getAudience({
        externalId: 'seg-abc',
        settings: TEST_SETTINGS,
        audienceSettings: {}
      })
    ).rejects.toThrow(/unexpected response/i)
  })
})
