import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { REGIONS, SEGMENT_ENDPOINT } from '../../constants'

const testDestination = createTestIntegration(Destination)

const settings = {
  integrationKey: 'test-integration-key',
  region: REGIONS.DEFAULT.name
}

const SEGMENT_ID = 'seg-abc123'
const segmentBase = `/${SEGMENT_ENDPOINT}/${SEGMENT_ID}`

const baseMapping = {
  visitorId: { '@path': '$.userId' },
  segmentAudienceId: SEGMENT_ID,
  enable_batching: false
}

function makeEvent(userId: string, audienceValue: boolean, type: 'identify' | 'track' = 'identify') {
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

describe('Pendo Audiences - syncAudience perform', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should add a visitor to the audience successfully', async () => {
    nock(REGIONS.DEFAULT.domain)
      .patch(`${segmentBase}/visitor`, { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] })
      .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'add' }] })

    const responses = await testDestination.testAction('syncAudience', {
      event: makeEvent('user1', true),
      settings,
      mapping: baseMapping
    })

    expect(responses[0].status).toBe(200)
  })

  it('should remove a visitor from the audience successfully', async () => {
    nock(REGIONS.DEFAULT.domain)
      .patch(`${segmentBase}/visitor`, { patch: [{ op: 'remove', path: '/visitors', value: ['user1'] }] })
      .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'remove' }] })

    const responses = await testDestination.testAction('syncAudience', {
      event: makeEvent('user1', false),
      settings,
      mapping: baseMapping
    })

    expect(responses[0].status).toBe(200)
  })

  it('should add a visitor from a track event successfully', async () => {
    nock(REGIONS.DEFAULT.domain)
      .patch(`${segmentBase}/visitor`, { patch: [{ op: 'add', path: '/visitors', value: ['user1'] }] })
      .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'add' }] })

    const responses = await testDestination.testAction('syncAudience', {
      event: makeEvent('user1', true, 'track'),
      settings,
      mapping: baseMapping
    })

    expect(responses[0].status).toBe(200)
  })

  it('should remove a visitor from a track event successfully', async () => {
    nock(REGIONS.DEFAULT.domain)
      .patch(`${segmentBase}/visitor`, { patch: [{ op: 'remove', path: '/visitors', value: ['user1'] }] })
      .reply(200, { multistatus: [{ status: 200, message: 'success', operation: 'remove' }] })

    const responses = await testDestination.testAction('syncAudience', {
      event: makeEvent('user1', false, 'track'),
      settings,
      mapping: baseMapping
    })

    expect(responses[0].status).toBe(200)
  })

  it('should throw a validation error when visitorId is not provided', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: makeEvent('user1', true),
        settings,
        mapping: { ...baseMapping, visitorId: '' }
      })
    ).rejects.toThrow("The root value is missing the required field 'visitorId'.")
  })

  it('should throw a validation error when audience membership cannot be determined', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'user1',
      // computation_class is not "audience", so core cannot resolve membership
      context: { personas: { computation_key: 'test_audience', external_audience_id: SEGMENT_ID } }
    })

    await expect(
      testDestination.testAction('syncAudience', {
        event,
        settings,
        mapping: baseMapping
      })
    ).rejects.toThrow('Unable to determine audience membership for this event')
  })

  it('should throw an IntegrationError when the API returns 500', async () => {
    nock(REGIONS.DEFAULT.domain).patch(`${segmentBase}/visitor`).reply(500, { message: 'Internal Server Error' })

    await expect(
      testDestination.testAction('syncAudience', {
        event: makeEvent('user1', true),
        settings,
        mapping: baseMapping
      })
    ).rejects.toThrow('Internal Server Error')
  })
})
