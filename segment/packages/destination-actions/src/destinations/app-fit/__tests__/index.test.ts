import { SegmentEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import AppFitConfig from '../config'
import Definition from '../index'
const testDestination = createTestIntegration(Definition)

describe('App Fit', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock(AppFitConfig.apiUrl).get('/api-keys/current').reply(200, {})

      // This should match your authentication.fields
      const authData = { apiKey: '1234abc' }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })
  })

  describe('onDelete', () => {
    it('should call the delete metric event user endpoint', async () => {
      const userId = '1234'
      nock(AppFitConfig.apiUrl).delete(`/metric-event-users/${userId}?source=segment_destination`).reply(200, {})

      const event: SegmentEvent = {
        type: 'track',
        userId
      }
      const settings = {
        apiKey: '1234abc'
      }
      if (testDestination.onDelete) {
        await expect(testDestination.onDelete(event, settings)).resolves.not.toThrowError()
      }
    })
  })
})
