import nock from 'nock'
import { /* createTestEvent, */ createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { friendbuyBaseHost } from '..'

const testDestination = createTestIntegration(Definition)

describe('Friendbuy', () => {
  describe('testAuthentication', () => {
    test('valid merchantId', async () => {
      const merchantId = 'fedcaef4-4b77-4b36-b919-d0846c744aa8'
      nock(`https://campaign.${friendbuyBaseHost}`).get(`/${merchantId}/campaigns.js`).reply(200, {})

      const authData = { merchantId }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    test('invalid merchantId', async () => {
      const merchantId = 'bad-merchantId'
      nock(`https://campaign.${friendbuyBaseHost}`).get(`/${merchantId}/campaigns.js`).reply(403, {})

      const authData = { merchantId }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
