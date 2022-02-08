import nock from 'nock'
import { /* createTestEvent, */ createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { defaultMapiBaseUrl, getMapiBaseUrl } from '../cloudUtil'
import { authKey, authSecret } from './cloudUtil.mock'

const testDestination = createTestIntegration(Definition)

describe('Friendbuy', () => {
  const badSecret = 'bad mapi secret'
  const token = 'mapi auth token'
  const expires = '2021-12-01T14:29:52Z'

  describe('testAuthentication', () => {
    test('valid merchantId', async () => {
      nock(defaultMapiBaseUrl).post('/v1/authorization').reply(200, { token, expires })

      await expect(testDestination.testAuthentication({ authKey, authSecret })).resolves.not.toThrowError()
    })

    test('invalid merchantId', async () => {
      nock(defaultMapiBaseUrl).post('/v1/authorization').reply(403, {})

      await expect(testDestination.testAuthentication({ authKey, authSecret: badSecret })).rejects.toThrowError()
    })
  })
})

describe('getMapiBaseUrl', () => {
  test('production', () => {
    expect(getMapiBaseUrl('secret')).toEqual(['secret', defaultMapiBaseUrl])
  })
  test('sandbox', () => {
    expect(getMapiBaseUrl('sandbox:secret')).toEqual(['secret', 'https://mapi.fbot-sandbox.me'])
  })
})
