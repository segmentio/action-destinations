import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Destination from '../index'
import { REGIONS, SEGMENT_ENDPOINT } from '../constants'

const testDestination = createTestIntegration(Destination)

const settings = {
  integrationKey: 'test-integration-key',
  region: REGIONS.DEFAULT.name
}

describe('Pendo Audiences - createAudience', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should create a segment and return the segmentId', async () => {
    nock(REGIONS.DEFAULT.domain)
      .post(`/${SEGMENT_ENDPOINT}/upload`, { name: 'My Audience', visitors: ['empty-visitor'] })
      .reply(200, { segmentId: 'seg-abc123' })

    const result = await testDestination.createAudience({
      settings,
      audienceName: 'My Audience',
      audienceSettings: {}
    })

    expect(result).toEqual({ externalId: 'seg-abc123' })
  })

  it('should use audienceSettings.audienceName over audienceName when provided', async () => {
    nock(REGIONS.DEFAULT.domain)
      .post(`/${SEGMENT_ENDPOINT}/upload`, { name: 'Custom Name', visitors: ['empty-visitor'] })
      .reply(200, { segmentId: 'seg-custom' })

    const result = await testDestination.createAudience({
      settings,
      audienceName: 'Default Audience Name',
      audienceSettings: { audienceName: 'Custom Name' }
    })

    expect(result).toEqual({ externalId: 'seg-custom' })
  })

  it('should throw when no segment name is available', async () => {
    await expect(
      testDestination.createAudience({
        settings,
        audienceName: '',
        audienceSettings: {}
      })
    ).rejects.toThrowError('A Pendo Segment name is required')
  })
})

describe('Pendo Audiences - getAudience', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should return the segmentId when the segment exists', async () => {
    const segmentId = 'seg-abc123'

    nock(REGIONS.DEFAULT.domain)
      .get(`/${SEGMENT_ENDPOINT}/${segmentId}`)
      .reply(200, { id: segmentId, name: 'My Audience' })

    const result = await testDestination.getAudience({
      settings,
      externalId: segmentId
    })

    expect(result).toEqual({ externalId: segmentId })
  })

  it('should throw IntegrationError when segment ID in response does not match', async () => {
    const segmentId = 'seg-abc123'

    nock(REGIONS.DEFAULT.domain)
      .get(`/${SEGMENT_ENDPOINT}/${segmentId}`)
      .reply(200, { id: 'seg-different', name: 'Other Audience' })

    await expect(
      testDestination.getAudience({
        settings,
        externalId: segmentId
      })
    ).rejects.toThrowError(`Pendo segment with ID ${segmentId} not found`)
  })

  it('should throw when Pendo returns 404', async () => {
    const segmentId = 'seg-missing'

    nock(REGIONS.DEFAULT.domain)
      .get(`/${SEGMENT_ENDPOINT}/${segmentId}`)
      .reply(404, { message: 'Not Found' })

    await expect(
      testDestination.getAudience({
        settings,
        externalId: segmentId
      })
    ).rejects.toThrowError()
  })
})
