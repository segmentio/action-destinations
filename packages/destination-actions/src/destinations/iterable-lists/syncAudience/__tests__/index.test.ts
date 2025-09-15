import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { CONSTANTS } from '../../constants'
import { SegmentEvent } from '@segment/actions-core/*'

const testDestination = createTestIntegration(Destination)

describe('IterableLists.syncAudience', () => {
  describe('Individual events', () => {
    const goodIdentifySubscribeEvent = createTestEvent({
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

    const goodIdentifyUnsubscribeEvent = createTestEvent({
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
        ld_segment_test: false
      }
    })

    it('should not throw an error if the audience creation succeed - identify, subscribe', async () => {
      nock(CONSTANTS.API_BASE_URL).post('/lists').reply(204)
      nock(CONSTANTS.API_BASE_URL).post('/lists/subscribe').reply(204)

      await expect(
        testDestination.testAction('syncAudience', {
          event: goodIdentifySubscribeEvent,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should not throw an error if the audience creation succeed - identify, unsubscribe', async () => {
      nock(CONSTANTS.API_BASE_URL).post('/lists').reply(204)
      nock(CONSTANTS.API_BASE_URL).post('/lists/unsubscribe').reply(204)

      await expect(
        testDestination.testAction('syncAudience', {
          event: goodIdentifyUnsubscribeEvent,
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
              computation_key: 'test',
              external_audience_id: '4269566'
            }
          }
        },
        traits: {
          email: 'mario@nintendo.com',
          test: true
        },
        userId: 'mario@nintendo.com'
      },
      {
        type: 'identify',
        context: {
          personas: {
            audience_settings: {
              computation_key: 'test',
              external_audience_id: '4269566'
            }
          }
        },
        traits: {
          email: 'luigi@nintendo.com',
          test: false
        },
        userId: 'luigi@nintendo.com'
      }
    ]

    it('should not throw an error if the audience creation succeed - identify, subscribe + unsubscribe', async () => {
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
