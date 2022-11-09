import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Optimizely Full Stack', () => {
  describe('test Authentication', () => {
    it('should validate dataFile URL', async () => {
      const settings = {
        accountId: '12345566',
        dataFileUrl: 'https://cdn.example.com/dataFile.json'
      }
      nock(settings.dataFileUrl).get('').reply(200)
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })
})
