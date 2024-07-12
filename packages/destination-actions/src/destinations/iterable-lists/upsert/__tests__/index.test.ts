import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { CONSTANTS } from '../../constants'

const testDestination = createTestIntegration(Destination)

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
  }
})

describe('IterableLists.upsert', () => {
  it('should not throw an error if the audience creation succeed - identify', async () => {
    nock(CONSTANTS.API_BASE_URL).post('/lists').reply(204)

    await expect(
      testDestination.testAction('upsert', {
        event: goodIdentifyEvent,
        useDefaultMappings: true
      })
    ).resolves.not.toThrowError()
  })
})
