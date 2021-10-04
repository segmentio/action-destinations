// import nock from 'nock'
import { /* createTestEvent, */ createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Friendbuy', () => {
  describe('testAuthentication', () => {
    test('valid merchantId', async () => {
      // nock('https://your.destination.endpoint').get('*').reply(200, {})

      const authData = { merchantId: 'a7a464be-3e0a-46fa-8e90-ad93f5a9015e' }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    test('invalid merchantId', async () => {
      // nock('https://your.destination.endpoint').get('*').reply(200, {})

      const authData = { merchantId: 'bad-merchantId' }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })
})
