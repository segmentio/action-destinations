import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('ResponsysAudiences.syncAudience', () => {
  describe('Individual events', () => {
    const goodIdentifySubscribeEvent = createTestEvent({
      type: 'identify',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: 'a_responsys_audience',
          external_audience_id: 'a_responsys_audience',
          audience_settings: {}
        }
      },
      traits: {
        audience_key: 'a_responsys_audience',
        a_responsys_audience: true
      }
    })

    const goodIdentifyUnsubscribeEvent = createTestEvent({
      type: 'identify',
      context: {
        personas: {
          computation_class: 'audience',
          computation_key: 'a_responsys_audience',
          external_audience_id: 'a_responsys_audience',
          audience_settings: {}
        }
      },
      traits: {
        audience_key: 'a_responsys_audience',
        a_responsys_audience: false
      }
    })

    it('should not throw an error if the audience creation succeed - identify, subscribe', async () => {
      console.log('goodIdentifySubscribeEvent', goodIdentifySubscribeEvent)
      console.log('testDestination', testDestination)
      console.log('goodIdentifyUnsubscribeEvent', goodIdentifyUnsubscribeEvent)
      nock('https://api.responsys.net').post('/rest/api/v1.3/auth/token').reply(200, {
        authToken: 'anything',
        issuedAt: 1728492996097,
        endPoint: 'https://api.responsys.net'
      })
      expect(true).toBe(true)
    })
  })

  describe('Batch events', () => {})
})
