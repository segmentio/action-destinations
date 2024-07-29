import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { CONSTANTS } from '../../constants'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Destination)

describe('IterableLists.syncAudience', () => {
  describe('Individual events', () => {
    const goodIdentifyEvent = createTestEvent({
      type: 'identify',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: 'ld_segment_test',
          computation_id: 'ld_segment_audience_id',
          external_audience_id: '12345',
          audience_settings: {
            updateExistingUsersOnly: false,
            globalUnsubscribe: false
          }
        }
      },
      traits: {
        audience_key: 'ld_segment_test',
        ld_segment_test: true
      }
    })

    it('should not throw an error if the audience creation succeed - identify', async () => {
      nock(CONSTANTS.API_BASE_URL).post('/lists').reply(204)
      nock(CONSTANTS.API_BASE_URL).post('/lists/subscribe').reply(204)
      nock(CONSTANTS.API_BASE_URL).post('/lists/unsubscribe').reply(204)

      await expect(
        testDestination.testAction('syncAudience', {
          event: goodIdentifyEvent,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })
  })

  describe('Batch events', () => {
    const goodBatch: SegmentEvent[] = [
      {
        type: 'identify',
        context: {
          personas: {
            audience_settings: {
              computation_key: 'the_super_mario_bros_super_audience_2',
              external_audience_id: '4269566'
            }
          }
        },
        traits: {
          email: 'mario@nintendo.com'
        },
        userId: 'mario@nintendo.com'
      },
      {
        type: 'identify',
        context: {
          personas: {
            audience_settings: {
              computation_key: 'the_super_mario_bros_super_audience_2',
              external_audience_id: '4269566'
            }
          }
        },
        traits: {
          email: 'luigi@nintendo.com'
        },
        userId: 'luigi@nintendo.com'
      }
    ]

    it('should not throw an error if the audience creation succeed - identify', async () => {
      nock(CONSTANTS.API_BASE_URL).post('/lists').reply(204)
      nock(CONSTANTS.API_BASE_URL).post('/lists/subscribe').reply(204)
      nock(CONSTANTS.API_BASE_URL).post('/lists/unsubscribe').reply(204)

      await expect(
        testDestination.testBatchAction('syncAudience', {
          events: goodBatch,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })
  })
})
