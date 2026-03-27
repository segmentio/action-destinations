import nock from 'nock'
import { createTestEvent, createTestIntegration, PayloadValidationError } from '@segment/actions-core'
import type { StatsContext } from '@segment/actions-core'
import * as shared from '../shared'
import { syncAudience, validateMembership } from '../shared'
import syncAudienceAction from '../syncAudience'
import createRequestClient from '../../../../../core/src/create-request-client'
import { Payload } from '../syncAudience/generated-types'
const UPLOAD_HOST = 'https://cm.g.doubleclick.net'
const UPLOAD_PATH = '/upload?nid=segment'
const EXTERNAL_AUDIENCE_ID = 'products/DISPLAY_VIDEO_ADVERTISER/customers/123/userLists/456'

const mockPayload: Payload = {
  external_audience_id: EXTERNAL_AUDIENCE_ID,
  google_gid: 'CAESEHIV8HXNp0pFdHgi2rElMfk',
  mobile_advertising_id: '3b6e47b3-1437-4ba2-b3c9-446e4d0cd1e5',
  partner_provided_id: 'my-anon-id-42',
  enable_batching: true
}

// A payload that will produce zero ops (no IDs)
const mockPayloadNoIds: Payload = {
  external_audience_id: EXTERNAL_AUDIENCE_ID,
  enable_batching: true
}

const mockStatsClient = {
  incr: jest.fn(),
  observe: jest.fn(),
  _name: jest.fn(),
  _tags: jest.fn(),
  histogram: jest.fn(),
  set: jest.fn()
}

const mockStatsContext: StatsContext = {
  statsClient: mockStatsClient,
  tags: []
}

const mockRequestClient = createRequestClient()

// Minimal test destination to exercise perform/performBatch on the action
const testDestination = createTestIntegration({
  name: 'Test DV360 Sync',
  mode: 'cloud',
  authentication: { scheme: 'custom', fields: {} },
  actions: { syncAudience: syncAudienceAction }
})

// Engage-style track event. audienceMembership is resolved from these by the framework.
const makeEngageEvent = (membership: boolean) =>
  createTestEvent({
    type: 'track',
    anonymousId: 'my-anon-id-42',
    context: {
      personas: {
        computation_class: 'audience',
        computation_key: 'my_audience',
        external_audience_id: EXTERNAL_AUDIENCE_ID
      },
      device: { advertisingId: '3b6e47b3-1437-4ba2-b3c9-446e4d0cd1e5' },
      DV360: { google_gid: 'CAESEHIV8HXNp0pFdHgi2rElMfk' }
    },
    properties: { my_audience: membership }
  })

const baseMapping = {
  external_audience_id: { '@path': '$.context.personas.external_audience_id' },
  mobile_advertising_id: { '@path': '$.context.device.advertisingId' },
  google_gid: { '@path': '$.context.DV360.google_gid' },
  partner_provided_id: { '@path': '$.anonymousId' },
  enable_batching: true
}

describe('validateMembership', () => {
  it('throws when audienceMemberships is undefined', () => {
    expect(() => validateMembership([mockPayload], undefined)).toThrow(PayloadValidationError)
  })

  it('throws when audienceMemberships is not an array', () => {
    expect(() => validateMembership([mockPayload], {} as never)).toThrow(PayloadValidationError)
  })

  it('throws when lengths do not match', () => {
    expect(() => validateMembership([mockPayload, mockPayload], [true])).toThrow(PayloadValidationError)
  })

  it('throws when a membership value is not a boolean', () => {
    expect(() => validateMembership([mockPayload], [null as never])).toThrow(PayloadValidationError)
    expect(() => validateMembership([mockPayload], ['true' as never])).toThrow(PayloadValidationError)
    expect(() => validateMembership([mockPayload], [1 as never])).toThrow(PayloadValidationError)
  })

  it('does not throw for a valid array of booleans matching payload length', () => {
    expect(() => validateMembership([mockPayload, mockPayload], [true, false])).not.toThrow()
  })
})

describe('syncAudience', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  it('sends only an add request when all memberships are true', async () => {
    const scope = nock(UPLOAD_HOST).post(UPLOAD_PATH).once().reply(200)

    await syncAudience(mockRequestClient, [mockPayload], mockStatsContext, [true])

    expect(scope.isDone()).toBe(true)
  })

  it('sends only a delete request when all memberships are false', async () => {
    const scope = nock(UPLOAD_HOST).post(UPLOAD_PATH).once().reply(200)

    await syncAudience(mockRequestClient, [mockPayload], mockStatsContext, [false])

    expect(scope.isDone()).toBe(true)
  })

  it('sends both add and delete requests for a mixed batch', async () => {
    const scope = nock(UPLOAD_HOST).post(UPLOAD_PATH).twice().reply(200)

    await syncAudience(mockRequestClient, [mockPayload, mockPayload], mockStatsContext, [true, false])

    expect(scope.isDone()).toBe(true)
  })

  it('emits discard stat and sends no request when payload produces no ops', async () => {
    await syncAudience(mockRequestClient, [mockPayloadNoIds], mockStatsContext, [true])

    expect(mockStatsClient.incr).toHaveBeenCalledWith('syncAudience.discard', 1, mockStatsContext.tags)
    expect(nock.pendingMocks()).toHaveLength(0)
  })

  it('does not emit discard stat when at least one request has ops', async () => {
    nock(UPLOAD_HOST).post(UPLOAD_PATH).reply(200)

    await syncAudience(mockRequestClient, [mockPayload], mockStatsContext, [true])

    expect(mockStatsClient.incr).not.toHaveBeenCalledWith('syncAudience.discard', expect.anything(), expect.anything())
  })
})

describe('syncAudience action — perform', () => {
  let syncAudienceSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
    syncAudienceSpy = jest.spyOn(shared, 'syncAudience').mockResolvedValue({ status: 200 })
  })

  afterEach(() => {
    syncAudienceSpy.mockRestore()
  })

  it('throws PayloadValidationError when audienceMembership is undefined', async () => {
    syncAudienceSpy.mockRestore()
    // A plain track event without personas context resolves to undefined audienceMembership
    const event = createTestEvent({
      type: 'track',
      anonymousId: 'my-anon-id-42',
      context: { personas: { external_audience_id: EXTERNAL_AUDIENCE_ID } }
    })

    await expect(
      testDestination.testAction('syncAudience', {
        event,
        mapping: baseMapping
      })
    ).rejects.toThrow(PayloadValidationError)
  })
})

describe('syncAudience action — performBatch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  it('sends only an add request for an all-true batch', async () => {
    const scope = nock(UPLOAD_HOST).post(UPLOAD_PATH).once().reply(200)

    await testDestination.executeBatch('syncAudience', {
      events: [makeEngageEvent(true), makeEngageEvent(true)],
      mapping: baseMapping
    })

    expect(scope.isDone()).toBe(true)
  })

  it('sends only a delete request for an all-false batch', async () => {
    const scope = nock(UPLOAD_HOST).post(UPLOAD_PATH).once().reply(200)

    await testDestination.executeBatch('syncAudience', {
      events: [makeEngageEvent(false), makeEngageEvent(false)],
      mapping: baseMapping
    })

    expect(scope.isDone()).toBe(true)
  })

  it('sends both add and delete requests for a mixed batch', async () => {
    const scope = nock(UPLOAD_HOST).post(UPLOAD_PATH).twice().reply(200)

    await testDestination.executeBatch('syncAudience', {
      events: [makeEngageEvent(true), makeEngageEvent(false)],
      mapping: baseMapping
    })

    expect(scope.isDone()).toBe(true)
  })
})
