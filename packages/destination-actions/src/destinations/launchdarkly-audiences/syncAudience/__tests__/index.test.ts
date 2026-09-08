import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import isEqual from 'lodash/isEqual'
import Destination from '../../index'
import { CONSTANTS } from '../../constants'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

const settings: Settings = { apiKey: 'test-api-key', clientId: 'test-client-id' }

// Expected LaunchDarkly segment-targets request body for goodTrackEvent / goodTrackEventJourneyStep below.
// computation_class is only used as a gate (see ENGAGE_AUDIENCE_COMPUTATION_CLASSES-equivalent choices on
// segment_computation_action) - it is not otherwise referenced when building the request, so 'audience' and
// 'journey_step' payloads that are otherwise identical produce an identical request body.
const expectedTrackBody = {
  environmentId: 'test-client-id',
  contextKind: 'user',
  batch: [
    {
      userId: 'user1234',
      cohortName: 'Ld segment test',
      cohortId: 'ld_segment_audience_id',
      value: true
    }
  ]
}

const goodTrackEvent = createTestEvent({
  type: 'track',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ld_segment_test',
      computation_id: 'ld_segment_audience_id'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  properties: {
    audience_key: 'ld_segment_test',
    ld_segment_test: true
  }
})

const goodTrackEventJourneyStep = createTestEvent({
  type: 'track',
  context: {
    personas: {
      computation_class: 'journey_step',
      computation_key: 'ld_segment_test',
      computation_id: 'ld_segment_audience_id'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  properties: {
    audience_key: 'ld_segment_test',
    ld_segment_test: true
  }
})

const goodIdentifyEvent = createTestEvent({
  type: 'identify',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'ld_segment_test',
      computation_id: 'ld_segment_audience_id'
    }
  },
  traits: {
    audience_key: 'ld_segment_test',
    ld_segment_test: true
  },
  properties: undefined
})

const badEvent = createTestEvent({
  context: {
    personas: {
      computation_key: 'ld_segment_test',
      computation_id: 'ld_segment_audience_id'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  properties: {
    audience_key: 'ld_segment_test',
    ld_segment_test: true
  }
})

describe('LaunchDarklyAudiences.syncAudience', () => {
  it('should not throw an error if the audience creation succeed - track', async () => {
    nock(CONSTANTS.LD_API_BASE_URL)
      .post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT, (body) => isEqual(body, expectedTrackBody))
      .reply(204)

    const responses = await testDestination.testAction('syncAudience', {
      event: goodTrackEvent,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
  })

  it('should not throw an error if the audience creation succeed - track (journey_step)', async () => {
    nock(CONSTANTS.LD_API_BASE_URL)
      .post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT, (body) => isEqual(body, expectedTrackBody))
      .reply(204)

    const responses = await testDestination.testAction('syncAudience', {
      event: goodTrackEventJourneyStep,
      settings,
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(204)
  })

  it('should not throw an error if the audience creation succeed - identify', async () => {
    nock(CONSTANTS.LD_API_BASE_URL).post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT).reply(204)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodIdentifyEvent,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if the audience creation failed, bad body', async () => {
    nock(CONSTANTS.LD_API_BASE_URL).post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT).reply(400)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodTrackEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Bad Request')
  })

  it('should throw an error if audience creation event missing mandatory field', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: badEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'")
  })

  it('should throw an error with an invalid API key', async () => {
    nock(CONSTANTS.LD_API_BASE_URL).post(CONSTANTS.LD_API_CUSTOM_AUDIENCE_ENDPOINT).reply(403)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodTrackEvent,
        useDefaultMappings: true
      })
    ).rejects.toThrowError('Forbidden')
  })
})
