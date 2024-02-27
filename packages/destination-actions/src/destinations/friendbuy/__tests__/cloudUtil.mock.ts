import nock from 'nock'

import { defaultMapiBaseUrl } from '../cloudUtil'

export const authKey = '00000000-0000-0000-0000-000000000000' // not a real secret
export const authSecret = 'mapi secret'
const token = 'mapi auth token'
const expires = new Date(Date.now() + 300 * 1000).toISOString()

// Mock the authentication token request for other tests.
export function nockAuth() {
  nock(defaultMapiBaseUrl).post('/v1/authorization').reply(200, { token, expires })
}

// Empty test so that jest will not complain.
describe('empty', () => {
  test('empty', () => {})
})
