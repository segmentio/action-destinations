import nock from 'nock'
import { createRequestClient } from '@segment/actions-core'
import { sendRefreshTokenReq } from '../auth-utils'

describe('sendRefreshTokenReq', () => {
  const request = createRequestClient()
  const baseOauth = {
    type: 'clientCredentials',
    clientId: 'id',
    clientSecret: 'secret',
    refreshTokenServerUrl: 'https://auth.example.com/token'
  }

  afterEach(() => {
    nock.cleanAll()
    delete (Object.prototype as any).polluted
  })

  it('applies header, body and query custom params to the refresh request', async () => {
    nock('https://auth.example.com', { reqheaders: { 'x-custom': 'h' } })
      .post('/token', (body) => body.extra === 'b')
      .query({ q: '1' })
      .reply(200, { access_token: 'token' })

    const result = await sendRefreshTokenReq(
      request,
      {
        dynamicAuthSettings: {
          oauth: {
            ...baseOauth,
            customParams: {
              refreshRequest: [
                { key: 'x-custom', value: 'h', sendIn: 'header' },
                { key: 'extra', value: 'b', sendIn: 'body' },
                { key: 'q', value: '1', sendIn: 'query' }
              ]
            }
          }
        }
      },
      {}
    )

    expect(result).toEqual({ accessToken: 'token' })
  })

  it.each(['__proto__', 'constructor', 'prototype'])('ignores disallowed sendIn "%s"', async (sendIn) => {
    nock('https://auth.example.com').post('/token').reply(200, { access_token: 'token' })

    const result = await sendRefreshTokenReq(
      request,
      {
        dynamicAuthSettings: {
          oauth: {
            ...baseOauth,
            customParams: { refreshRequest: [{ key: 'polluted', value: 'yes', sendIn }] }
          }
        }
      },
      {}
    )

    expect(result).toEqual({ accessToken: 'token' })
    expect(({} as any).polluted).toBeUndefined()
    expect((Object.prototype as any).polluted).toBeUndefined()
  })
})
