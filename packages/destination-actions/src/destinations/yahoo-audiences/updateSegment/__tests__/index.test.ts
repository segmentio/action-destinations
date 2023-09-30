import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('YahooAudiences.updateSegment', () => {
  describe('Success cases', () => {
    it('Success - should update yahoo subtaxonomy', async () => {
      // Given
      const event = createTestEvent({
        context: {
          device: {
            type: 'mobile',
            advertisingId: '123'
          },
          personas: {
            computation_id: '123',
            computation_key: '234',
            computation_class: 'audience'
          }
        }
      })

      nock(`https://dataxonline.yahoo.com`).post('/online/audience/').reply(200)

      // When
      const responses = await testDestination.testAction('updateSegment', {
        event,
        mapping: {},
        useDefaultMappings: true,
        settings: {
          engage_space_id: '123',
          mdm_id: '234',
          taxonomy_client_key: '345',
          taxonomy_client_secret: '456',
          customer_desc: 'Spacely Sprockets'
        }
      })

      // Then
      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)
    })
  })

  describe('Failure cases', () => {
    it('Failure - Unauthorized', async () => {
      // Given
      const event = createTestEvent({
        context: {
          device: {
            type: 'mobile',
            advertisingId: '123'
          },
          personas: {
            computation_id: '123',
            computation_key: '234',
            computation_class: 'audience'
          }
        }
      })

      // When
      nock(`https://dataxonline.yahoo.com`).post('/online/audience/').reply(401)
      const response = await testDestination.testAction('updateSegment', {
        event,
        mapping: {},
        useDefaultMappings: true,
        settings: {
          engage_space_id: '123',
          mdm_id: '234',
          taxonomy_client_key: '345',
          taxonomy_client_secret: '456',
          customer_desc: 'Spacely Sprockets'
        }
      })

      // Then
      expect(response).toHaveLength(1)
      expect(response[0].status).toBe(401)
    })
  })
})
