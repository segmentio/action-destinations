import nock from 'nock'
import { /* createTestEvent, */ createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { mapiUrl } from '../cloudUtil'
import { authKey, authSecret } from './cloudUtil.mock'

const testDestination = createTestIntegration(Definition)

describe('Friendbuy', () => {
  const badSecret = 'bad mapi secret'
  const token = 'mapi auth token'
  const expires = '2021-12-01T14:29:52Z'

  describe('testAuthentication', () => {
    test('valid merchantId', async () => {
      nock(mapiUrl).post('/v1/authorization').reply(200, { token, expires })

      await expect(testDestination.testAuthentication({ authKey, authSecret })).resolves.not.toThrowError()
    })

    test('invalid merchantId', async () => {
      nock(mapiUrl).post('/v1/authorization').reply(403, {})

      await expect(testDestination.testAuthentication({ authKey, authSecret: badSecret })).rejects.toThrowError()
    })
  })
})
