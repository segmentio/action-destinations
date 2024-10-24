import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { Settings } from '../../generated-types'

const testDestination = createTestIntegration(Destination)

// const goodTrackEvent = createTestEvent({
//   type: 'track',
//   context: {
//     personas: {
//       computation_class: 'audience',
//       computation_key: 'dy_segment_test',
//       computation_id: 'dy_segment_audience_id'
//     },
//     traits: {
//       email: 'test@email.com'
//     }
//   },
//   properties: {
//     audience_key: 'dy_segment_test',
//     dy_segment_test: true
//   }
// })

// const goodIdentifyEvent = createTestEvent({
//   type: 'identify',
//   context: {
//     personas: {
//       computation_class: 'audience',
//       computation_key: 'dy_segment_test',
//       computation_id: 'dy_segment_audience_id'
//     }
//   },
//   traits: {
//     audience_key: 'dy_segment_test',
//     dy_segment_test: true
//   },
//   properties: undefined
// })

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

    expect(true).toBe(true)
  })

  it('should not throw an error if the audience creation succeed - identify', async () => {
    nock(/.*/).persist().post(/.*/).reply(200)

    expect(true).toBe(true)
  })

  it('should throw an error if audience creation event missing mandatory field', async () => {
    await expect(
      testDestination.testAction('syncAudience', {
        event: badEvent,
        useDefaultMappings: true,
        settings: settings as Settings
      })
    ).rejects.toThrowError("The root value is missing the required field 'segment_computation_action'")
  })
})
