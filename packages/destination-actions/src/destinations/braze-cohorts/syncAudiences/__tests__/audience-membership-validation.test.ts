import nock from 'nock'
import { createTestIntegration, FLAGS } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const basePayload = {
  external_id: 'user-123',
  cohort_id: 'aud_123',
  cohort_name: 'test_audience',
  personas_audience_key: 'test_audience',
  event_properties: { test_audience: true },
  time: '2022-12-01T17:40:04.055Z',
  enable_batching: true
}

const settings = {
  endpoint: 'https://rest.iad-01.braze.com' as const,
  client_secret: 'valid_client_secret_key'
}

const featuresWithFlag = { [FLAGS.ACTIONS_BRAZE_COHORTS_AUDIENCE_MEMBERSHIP]: true }

const stateContext = {
  getRequestContext: () => basePayload.cohort_name,
  setResponseContext: () => undefined
}

// Access the underlying action definition to call performBatch directly,
// bypassing the framework's audienceMembership computation so we can test
// the validation logic with controlled inputs.
const syncAudiencesAction = (testDestination as any).definition.actions.syncAudiences

// The validation checks throw before any HTTP request is made,
// so a minimal mock request function is sufficient.
const mockRequest = (() => {}) as any

describe('Audience Membership Validation (flag on)', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should throw when audienceMemberships is not an array', async () => {
    await expect(
      syncAudiencesAction.performBatch(mockRequest, {
        settings,
        payload: [basePayload],
        audienceMembership: undefined,
        features: featuresWithFlag,
        stateContext
      })
    ).rejects.toThrow('Audience Memberships must be an array')
  })

  it('should throw when audienceMemberships length does not match payloads length', async () => {
    await expect(
      syncAudiencesAction.performBatch(mockRequest, {
        settings,
        payload: [basePayload, basePayload],
        audienceMembership: [true],
        features: featuresWithFlag,
        stateContext
      })
    ).rejects.toThrow('Audience Memberships length must match payloads length')
  })

  it('should throw when an audienceMembership value is not a boolean', async () => {
    await expect(
      syncAudiencesAction.performBatch(mockRequest, {
        settings,
        payload: [basePayload],
        audienceMembership: ['true'],
        features: featuresWithFlag,
        stateContext
      })
    ).rejects.toThrow('Audience Membership must be a boolean')
  })
})
