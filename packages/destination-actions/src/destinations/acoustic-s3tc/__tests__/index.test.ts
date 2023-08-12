import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import '@types/jest'

const testDestination = createTestIntegration(Definition)

describe('Acoustic S3TC', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://your.destination.endpoint').get('*').reply(200, {})

      const settings = {
        cacheType: '',
        __segment_internal_engage_force_full_sync: false,
        __segment_internal_engage_batch_sync: false
      }

      createTestEvent.length

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
