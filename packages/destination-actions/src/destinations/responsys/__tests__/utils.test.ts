import nock from 'nock'
import { RequestClient } from '@segment/actions-core'
import { AuthTokens } from '@segment/actions-core/destination-kit/parse-settings'
import { Settings } from '../generated-types'
import { stringifyObject, upsertListMembers } from '../utils'

const baseUrl = 'https://123456-api.responsys.ocs.oraclecloud.com'
const settings = {
  baseUrl,
  username: 'abcd',
  userPassword: 'abcd',
  insertOnNoMatch: false,
  matchColumnName1: 'EMAIL_ADDRESS_',
  updateOnMatch: 'REPLACE_ALL',
  defaultPermissionStatus: 'OPTOUT',
  profileListName: 'TEST_PROFILE_LIST'
} as Settings
const authTokens = { accessToken: 'abcd1234', refreshToken: 'efgh5678' } as AuthTokens

// JSON.parse creates an own "__proto__" property, unlike an object literal.
const protoOnly = () => JSON.parse('{"__proto__": "x"}')

describe('responsys utils', () => {
  afterEach(() => nock.cleanAll())

  describe('stringifyObject', () => {
    it('stringifies values and keeps an own __proto__ key as data', () => {
      const result = stringifyObject(JSON.parse('{"__proto__": "x", "a": 1}'))
      expect(Object.getPrototypeOf(result)).toBeNull()
      expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).toBe(true)
      expect(Object.keys(result).sort()).toEqual(['__proto__', 'a'])
      expect(result.a).toBe('1')
      expect(({} as Record<string, unknown>).a).toBeUndefined()
    })
  })

  describe('upsertListMembers', () => {
    it('groups records and does not throw when userData has a lone __proto__ key', async () => {
      const bodies: any[] = []
      nock(baseUrl)
        .post('/rest/api/v1.3/lists/TEST_PROFILE_LIST/members', (body) => {
          bodies.push(body)
          return true
        })
        .times(2)
        .reply(200, {})

      const payload = [
        { userData: protoOnly() },
        { userData: { EMAIL_ADDRESS_: 'a@b.com' } },
        { userData: { EMAIL_ADDRESS_: 'c@d.com' } }
      ] as any

      const responses = await upsertListMembers({} as RequestClient, authTokens, payload, settings, false)

      expect(responses).toHaveLength(2)
      const emailBody = bodies.find((b) => b.recordData.fieldNames[0] === 'EMAIL_ADDRESS_')
      expect(emailBody.recordData.records).toEqual([['a@b.com'], ['c@d.com']])
      expect(Object.keys(Object.prototype)).toEqual([])
    })
  })
})
