import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const goodTrackEvent = createTestEvent({
  type: 'track',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'dy_segment_test'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  properties: {
    audience_key: 'dy_segment_test',
    dy_segment_test: true
  }
})

const goodIdentifyEvent = createTestEvent({
  type: 'identify',
  context: {
    personas: {
      computation_class: 'audience',
      computation_key: 'dy_segment_test'
    }
  },
  traits: {
    audience_key: 'dy_segment_test',
    dy_segment_test: true
  },
  properties: undefined
})

const badEvent = createTestEvent({
  context: {
    personas: {
      computation_key: 'dy_segment_test'
    },
    traits: {
      email: 'test@email.com'
    }
  },
  properties: {
    audience_key: 'dy_segment_test',
    dy_segment_test: true
  }
})

describe('DynamicYieldAudiences.syncAudience', () => {
  const settings = {
    sectionId: 'test-section-id',
    dataCenter: 'com',
    accessKey: 'test-access-key'
  }
  it('should not throw an error if the audience creation succeed - track', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodTrackEvent,
        useDefaultMappings: true,
        settings: settings
      })
    ).resolves.not.toThrowError()
  })

  it('should not throw an error if the audience creation succeed - identify', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    await expect(
      testDestination.testAction('syncAudience', {
        event: goodIdentifyEvent,
        useDefaultMappings: true,
        settings: settings
      })
    ).resolves.not.toThrowError()
  })

  it('should throw an error if audience creation event missing mandatory field', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: badEvent,
        useDefaultMappings: true,
        settings: settings
      })
    ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'")
  })
})
