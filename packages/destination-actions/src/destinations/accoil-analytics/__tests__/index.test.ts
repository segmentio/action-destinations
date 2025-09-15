import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { endpointApiKey, endpointUrl } from '../utils'

const testDestination = createTestIntegration(Definition)

describe('Accoil Analytics', () => {
  describe('testAuthentication', () => {
    it('should Test Auth Header', async () => {
      nock('https://in.accoil.com')
        .post('/segment')
        .reply(400, { message: "API Key should start with 'Basic' and be followed by a space and your API key." })

      // This should match your authentication.fields
      const authData = { api_key: 'secret' }
      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })

  describe('utils', () => {
    it('should calculate correct API Keys while honouring case', () => {
      const stgApiKeys = [
        ['stg_abc', 'abc'],
        ['STG_ABC', 'ABC'],
        ['StG_aBc', 'aBc'],
        ['stG_abc', 'abc']
      ]
      stgApiKeys.forEach((key) => expect(endpointApiKey(key[0])).toBe(key[1]))

      const prodApiKeys = ['abc', 'ab_stg_abcd', 'abstg_', 'ABCDstg_EF', 'AbDE_STG']
      prodApiKeys.forEach((key) => expect(endpointApiKey(key)).toBe(key))
    })
    it('should calculate correct URL with case insensitivity', () => {
      const stgApiKeys = ['stg_abc', 'STG_ABC', 'StG_aBc', 'stG_abc']
      stgApiKeys.forEach((key) => expect(endpointUrl(key)).toBe('https://instaging.accoil.com/segment'))

      const prodApiKeys = ['abc', 'ab_stg_abcd', 'abstg_', 'ABCDstg_EF', 'AbDE_STG']
      prodApiKeys.forEach((key) => expect(endpointUrl(key)).toBe('https://in.accoil.com/segment'))
    })
  })
})
