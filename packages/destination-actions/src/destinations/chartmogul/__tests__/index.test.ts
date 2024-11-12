import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Chart Mogul', () => {
  describe('testAuthentication', () => {
    it('should validate that chartmogul_webhook_url starts with https://', async () => {
      try {
        await testDestination.testAuthentication({ chartmogul_webhook_url: 'httpp://wh.endpoint' })
      } catch (err: any) {
        expect(err.message).toContain('Please configure the ChartMogul webhook URL')
      }
    }),
      it('should test that authentication works', async () => {
        nock('https://chartmogul.webhook.endpoint').post('/').reply(200, {})

        const authData = { chartmogul_webhook_url: 'https://chartmogul.webhook.endpoint' }

        await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
      }),
      it('should test that authentication fails', async () => {
        nock('https://wrong.chartmogul.webhook.endpoint')
          .post('/')
          .reply(403, { errors: [{ field: null, message: 'access forbidden' }] })

        const authData = { chartmogul_webhook_url: 'https://wrong.chartmogul.webhook.endpoint' }

        try {
          await testDestination.testAuthentication(authData)
        } catch (err: any) {
          expect(err.message).toContain('Credentials are invalid')
        }
      })
  })
})
