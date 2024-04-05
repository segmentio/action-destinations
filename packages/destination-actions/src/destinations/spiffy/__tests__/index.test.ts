import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Spiffy', () => {
  describe('testAuthentication', () => {
    it('should validate authentication inputs', async () => {
      nock('https://segment-intake.dev.spiffy.ai').get('*').reply(200, {})

      const settings = {
        org_id: '<test username>',
        api_key: '<test password>',
        environment: 'dev'
      }

      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
