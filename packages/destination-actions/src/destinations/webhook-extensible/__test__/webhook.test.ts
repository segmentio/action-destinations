import nock from 'nock'
import {
  PayloadValidationError,
  createTestEvent,
  createTestIntegration,
  DestinationDefinition
} from '@segment/actions-core'
import Webhook from '../index'

const settings = {
  oauth: {},
  dynamicAuthSettings: {
    oauth: {
      type: 'authCode',
      clientId: 'clientID',
      clientSecret: 'clientSecret',
      scopes: 'scope',
      authorizationServerUrl: 'https://www.webhook-extensible/authorize',
      accessTokenServerUrl: 'https://www.webhook-extensible/access_token',
      refreshTokenServerUrl: 'https://www.webhook-extensible/refresh_token',
      access: {
        access_token: 'accessToken1',
        token_type: 'bearer',
        expires_in: 86400,
        refresh_token: 'refreshToken1',
        scope: 'scope'
      },
      customParams: {}
    }
  }
}

const noAuthSettings = {
  oauth: {},
  dynamicAuthSettings: {
    oauth: {
      type: 'noAuth'
    }
  }
}

const bearerTypeSettings = {
  oauth: {},
  dynamicAuthSettings: {
    oauth: {
      type: 'bearer'
    },
    bearer: {
      bearerToken: 'BearerToken1'
    }
  }
}

const bearerTypeSettings2 = {
  oauth: {},
  dynamicAuthSettings: {
    oauth: {
      clientId: 'clientID',
      clientSecret: 'clientSecret',
      type: 'bearer'
    },
    bearer: {
      bearerToken: 'BearerToken1'
    }
  }
}

const auth = {
  refreshToken: 'refreshToken1',
  accessToken: 'accessToken1',
  clientId: 'clientID',
  clientSecret: 'clientSecret'
}

const authWithoutRefreshToken = {
  refreshToken: '',
  accessToken: 'accessToken1',
  clientId: 'clientID',
  clientSecret: 'clientSecret'
}

const expectedRequest = {
  grant_type: 'refresh_token',
  refresh_token: 'refreshToken1',
  scope: 'scope',
  client_id: 'clientID',
  client_secret: 'clientSecret'
}

const customParams = [
  { key: 'param1', value: 'val1', sendIn: 'header' },
  { key: 'param2', value: 'val2', sendIn: 'header' },
  { key: 'param3', value: 'val3', sendIn: 'body' },
  { key: 'param4', value: 'val4', sendIn: 'body' },
  { key: 'param5', value: 'val5', sendIn: 'query' },
  { key: 'param6', value: 'val6', sendIn: 'query' }
]

// Exported so we can re-use to test webhook-audiences
export const baseWebhookTests = (def: DestinationDefinition<any>) => {
  const testDestination = createTestIntegration(def)
  describe(def.name, () => {
    describe('send', () => {
      it('should work with default mapping', async () => {
        const url = 'https://example.com'
        const event = createTestEvent()

        nock(url)
          .post('/', event as any)
          .reply(200)

        const responses = await testDestination.testAction('send', {
          event,
          mapping: {
            url
          },
          useDefaultMappings: true
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('supports customizations', async () => {
        const url = 'https://example.build'
        const event = createTestEvent()
        const headerField = 'Custom-Header'
        const headerValue = 'Custom-Value'
        const data = { cool: true }

        nock(url).put('/', data).matchHeader(headerField, headerValue).reply(200)

        const responses = await testDestination.testAction('send', {
          event,
          mapping: {
            url,
            method: 'PUT',
            headers: { [headerField]: headerValue },
            data
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('send for noAuth with no header', async () => {
        const url = 'https://example.build'
        const event = createTestEvent()
        const data = { cool: true }

        nock(url).put('/', data).reply(200)

        const responses = await testDestination.testAction('send', {
          settings: noAuthSettings,
          event,
          mapping: {
            url,
            method: 'PUT',
            data
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('send with custom params and no token prefix', async () => {
        const url = 'https://example.build'
        const event = createTestEvent()
        const data = { cool: true }
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: customParams
        }

        nock(url).put('/', data).matchHeader('authorization', 'Bearer accessToken1').reply(200)

        const responses = await testDestination.testAction('send', {
          settings: newSettings,
          event,
          mapping: {
            url,
            method: 'PUT',
            data
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('send with custom params and a token prefix', async () => {
        const url = 'https://example.build'
        const event = createTestEvent()
        const data = { cool: true }
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: customParams,
          tokenPrefix: 'Basic'
        }

        nock(url).put('/', data).matchHeader('authorization', 'Basic accessToken1').reply(200)

        const responses = await testDestination.testAction('send', {
          settings: newSettings,
          event,
          mapping: {
            url,
            method: 'PUT',
            data
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('should throw an error when header value is invalid', async () => {
        const url = 'https://example.build'
        const event = createTestEvent()
        const headerField = 'Custom-Header'
        const headerValue = 'هيثم'
        const data = { cool: true }

        nock(url)
          .put('/', data)
          .matchHeader(headerField, headerValue)
          .replyWithError('TypeError: هيثم is not a legal HTTP header value')

        await expect(
          testDestination.testAction('send', {
            event,
            mapping: {
              url,
              method: 'PUT',
              headers: { [headerField]: headerValue },
              data
            }
          })
        ).rejects.toThrow(PayloadValidationError)
      })
    })

    describe('refreshAccessToken', () => {
      it('should return empty access token for noAuth refresh type', async () => {
        const mockResponse = {
          access_token: ''
        }
        nock(`https://www.webhook-extensible/refresh_token`).post('').reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(noAuthSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })

      it('should return empty access token for bearer refresh type', async () => {
        const mockResponse = {
          access_token: ''
        }
        nock(`https://www.webhook-extensible/refresh_token`).post('').reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(bearerTypeSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })

      it('should return empty access token for bearer refresh type', async () => {
        const mockResponse = {
          access_token: ''
        }
        nock(`https://www.webhook-extensible/refresh_token`).post('').reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(bearerTypeSettings2, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })

      it('should return access token for authCode type', async () => {
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post('', new URLSearchParams(expectedRequest).toString())
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(settings, authWithoutRefreshToken)

        expect(token).toEqual({ accessToken: mockResponse.access_token, refreshToken: mockResponse.refresh_token })
      })

      it('should return access token for authCode type', async () => {
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post('', new URLSearchParams(expectedRequest).toString())
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(settings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token, refreshToken: mockResponse.refresh_token })
      })

      it('should return access token for authCode type with custom params', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: customParams
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              ...expectedRequest,
              param3: 'val3',
              param4: 'val4'
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .matchHeader('param1', 'val1')
          .matchHeader('param2', 'val2')
          .query({ param5: 'val5', param6: 'val6' })
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token, refreshToken: mockResponse.refresh_token })
      })

      it('should return access token for authCode type with only custom header', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: [customParams[0], customParams[1]]
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              ...expectedRequest
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .matchHeader('param1', 'val1')
          .matchHeader('param2', 'val2')
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token, refreshToken: mockResponse.refresh_token })
      })

      it('should return access token for authCode type with only custom body', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: [customParams[2], customParams[3]]
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              ...expectedRequest,
              param3: 'val3',
              param4: 'val4'
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token, refreshToken: mockResponse.refresh_token })
      })

      it('should return access token for authCode type with only custom query params', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: [customParams[4], customParams[5]]
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              ...expectedRequest
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .query({ param5: 'val5', param6: 'val6' })
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token, refreshToken: mockResponse.refresh_token })
      })

      it('should return access token for clientCredentials type', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.type = 'clientCredentials'
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              grant_type: 'client_credentials',
              scope: 'scope'
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })

      it('should return access token for clientCredentials type with custom params', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.type = 'clientCredentials'
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: customParams
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              grant_type: 'client_credentials',
              scope: 'scope',
              param3: 'val3',
              param4: 'val4'
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .query({ param5: 'val5', param6: 'val6' })
          .matchHeader('param1', 'val1')
          .matchHeader('param2', 'val2')
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })

      it('should return access token for clientCredentials type with custom header', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.type = 'clientCredentials'
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: [customParams[0], customParams[1]]
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              grant_type: 'client_credentials',
              scope: 'scope'
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .matchHeader('param1', 'val1')
          .matchHeader('param2', 'val2')
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })

      it('should return access token for clientCredentials type with custom body', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.type = 'clientCredentials'
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: [customParams[2], customParams[3]]
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              grant_type: 'client_credentials',
              scope: 'scope',
              param3: 'val3',
              param4: 'val4'
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })

      it('should return access token for clientCredentials type with custom query params', async () => {
        const newSettings = JSON.parse(JSON.stringify(settings))
        newSettings.dynamicAuthSettings.oauth.type = 'clientCredentials'
        newSettings.dynamicAuthSettings.oauth.customParams = {
          refreshRequest: [customParams[4], customParams[5]]
        }
        const mockResponse = {
          access_token: 'accessToken123',
          refresh_token: 'refreshToken123'
        }
        nock(`https://www.webhook-extensible/refresh_token`)
          .post(
            '',
            new URLSearchParams({
              grant_type: 'client_credentials',
              scope: 'scope'
            }).toString()
          )
          .matchHeader('Authorization', `Basic ${Buffer.from('clientID:clientSecret').toString('base64')}`)
          .query({ param5: 'val5', param6: 'val6' })
          .reply(200, mockResponse)

        const token = await testDestination.refreshAccessToken(newSettings, auth)

        expect(token).toEqual({ accessToken: mockResponse.access_token })
      })
    })
  })
}

baseWebhookTests(Webhook)
