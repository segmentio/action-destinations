import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { CONSTANTS } from '../../constants'

const testDestination = createTestIntegration(Destination)
const goodEvent = createTestEvent({
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'aval_test_two_track_only'
    },
    traits: {
      email: 'test.email@test.com'
    }
  },
  traits: {
    email: 'test.email@test.com',
    aval_test_audience_for_chewy: true
  },
  properties: {
    audience_key: 'aval_test_two_track_only',
    aval_test_two_track_only: true
  }
})

const goodEventHashedEmail = createTestEvent({
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'aval_test_two_track_only'
    },
    traits: {
      email_sha256: 'd2a904f42a7f3632a0b9df96d33071b7ea31517d38fe3a8b1333f1ccec475f8c'
    }
  },
  traits: {
    email_sha256: 'd2a904f42a7f3632a0b9df96d33071b7ea31517d38fe3a8b1333f1ccec475f8c',
    aval_test_audience_for_chewy: true
  },
  properties: {
    audience_key: 'aval_test_two_track_only',
    aval_test_two_track_only: true
  }
})

const badEvent = createTestEvent({
  context: {
    personas: {
      computation_key: 'aval_test_two_track_only'
    },
    traits: {
      email: 'test.email@test.com'
    }
  },
  traits: {
    email: 'test.email@test.com',
    aval_test_audience_for_chewy: true
  },
  properties: {
    audience_key: 'aval_test_two_track_only',
    aval_test_two_track_only: true
  }
})

describe('RoktAudiences.upsertCustomAudiences', () => {
  it('should not throw an error if the audience creation succeed', async () => {
    nock(CONSTANTS.ROKT_API_BASE_URL).post(CONSTANTS.ROKT_API_CUSTOM_AUDIENCE_ENDPOINT).reply(201)

    await expect(
      testDestination.testAction('upsertCustomAudiences', {
        event: goodEvent,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should not throw an error if the audience creation succeed - hashed emails', async () => {
    nock(CONSTANTS.ROKT_API_BASE_URL).post(CONSTANTS.ROKT_API_CUSTOM_AUDIENCE_ENDPOINT).reply(201)

    await expect(
      testDestination.testAction('upsertCustomAudiences', {
        event: goodEventHashedEmail,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if the audience creation failed, bad body', async () => {
    nock(CONSTANTS.ROKT_API_BASE_URL).post(CONSTANTS.ROKT_API_CUSTOM_AUDIENCE_ENDPOINT).reply(400)

    await expect(
      testDestination.testAction('upsertCustomAudiences', {
        event: goodEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Bad Request')
  })

  it('should throw an error if the audience creation failed, wrong api key auth', async () => {
    nock(CONSTANTS.ROKT_API_BASE_URL).post(CONSTANTS.ROKT_API_CUSTOM_AUDIENCE_ENDPOINT).reply(401)

    await expect(
      testDestination.testAction('upsertCustomAudiences', {
        event: goodEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Unauthorized')
  })

  it('should throw an error if audience creation event missing mandatory field', async () => {
    await expect(
      testDestination.testAction('upsertCustomAudiences', {
        event: badEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'.")
  })
})
