import nock from 'nock'
import { IntegrationError, createTestIntegration } from '@segment/actions-core'
import { createHmac } from 'crypto'

import Destination from '../index'
import { gen_update_segment_payload, generate_jwt } from '../utils-rt'
import { Payload } from '../updateSegment/generated-types'

const AUDIENCE_ID = 'aud_123456789012345678901234567' // References audienceSettings.audience_id
const AUDIENCE_KEY = 'sneakers_buyers' // References audienceSettings.audience_key
const ENGAGE_SPACE_ID = 'acme_corp_engage_space' // References settings.engage_space_id
const MDM_ID = 'mdm 123' // References settings.mdm_id
const CUST_DESC = 'ACME Corp' // References settings.customer_desc

const createAudienceInput = {
  settings: {
    engage_space_id: ENGAGE_SPACE_ID,
    mdm_id: MDM_ID,
    customer_desc: CUST_DESC
  },
  audienceName: '',
  audienceSettings: {},
  personas: {
    computation_key: AUDIENCE_KEY,
    computation_id: AUDIENCE_ID,
    namespace: 'spa_12124214124'
  }
}
const testDestination = createTestIntegration(Destination)

describe('Yahoo Audiences', () => {
  describe('createAudience() function', () => {
    const OLD_ENV = process.env
    beforeEach(() => {
      jest.resetModules() // Most important - it clears the cache
      process.env = { ...OLD_ENV } // Make a copy
      process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_SECRET = 'yoda'
      process.env.ACTIONS_YAHOO_AUDIENCES_TAXONOMY_CLIENT_ID = 'luke'
    })

    afterAll(() => {
      process.env = OLD_ENV // Restore old environment
    })

    describe('Success cases', () => {
      it('It should create the audience successfully', async () => {
        nock('https://datax.yahooapis.com').put(`/v1/taxonomy/append/${ENGAGE_SPACE_ID}`).reply(202, {
          anything: '123'
        })

        //createAudienceInput.audienceSettings.identifier = 'anything'
        const result = await testDestination.createAudience(createAudienceInput)
        expect(result.externalId).toBe(AUDIENCE_ID)
      })
    })
    describe('Failure cases', () => {
      it('should throw an error when engage_space_id setting is missing', async () => {
        createAudienceInput.settings.engage_space_id = ''
        await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
      })
    })
  })

  describe('refreshAccessToken() function - OAuth 2.0 Updates', () => {
    const settings = {
      engage_space_id: ENGAGE_SPACE_ID,
      mdm_id: MDM_ID,
      customer_desc: CUST_DESC
    }

    describe('Success cases', () => {
      it('should prefix client ID with idb2b.dsp.datax.', async () => {
        const mockResponse = {
          access_token: 'fake-test-token-abc123'
        }

        const mockClientId = 'test_client_id'
        const mockClientSecret = 'test_client_secret'
        const prefixedClientId = `idb2b.dsp.datax.${mockClientId}`

        // Mock the token endpoint with new URL
        const scope = nock('https://id.b2b.yahooincapis.com').post('/zts/v1/oauth2/token').reply(200, mockResponse)

        const result = await testDestination.refreshAccessToken(settings, {
          accessToken: 'old_token',
          refreshToken: 'refresh_token',
          clientId: prefixedClientId,
          clientSecret: mockClientSecret
        })

        expect(result).toEqual({ accessToken: 'fake-test-token-abc123' })
        expect(scope.isDone()).toBe(true)
      })

      it('should use the new token URL https://id.b2b.yahooincapis.com/zts/v1/oauth2/token', async () => {
        const mockResponse = {
          access_token: 'new_token_from_new_endpoint'
        }

        const scope = nock('https://id.b2b.yahooincapis.com').post('/zts/v1/oauth2/token').reply(200, mockResponse)

        const result = await testDestination.refreshAccessToken(settings, {
          accessToken: 'old_token',
          refreshToken: 'refresh_token',
          clientId: 'test_client',
          clientSecret: 'test_secret'
        })

        expect(result).toEqual({ accessToken: 'new_token_from_new_endpoint' })
        expect(scope.isDone()).toBe(true)
      })

      it('should include both batch and online writer scopes', async () => {
        const mockResponse = {
          access_token: 'token_with_both_scopes'
        }

        let requestBody: URLSearchParams | undefined

        const scope = nock('https://id.b2b.yahooincapis.com')
          .post('/zts/v1/oauth2/token', (body) => {
            requestBody = new URLSearchParams(body)
            return true
          })
          .reply(200, mockResponse)

        await testDestination.refreshAccessToken(settings, {
          accessToken: 'old_token',
          refreshToken: 'refresh_token',
          clientId: 'test_client',
          clientSecret: 'test_secret'
        })

        expect(requestBody?.get('scope')).toBe('idb2b.dsp.datax:role.online.writer')
        expect(scope.isDone()).toBe(true)
      })

      it('should use new audience claim https://id.b2b.yahooincapis.com/zts/v1', async () => {
        const mockResponse = {
          access_token: 'token_with_new_aud'
        }

        let requestBody: URLSearchParams | undefined

        const scope = nock('https://id.b2b.yahooincapis.com')
          .post('/zts/v1/oauth2/token', (body) => {
            requestBody = new URLSearchParams(body)
            return true
          })
          .reply(200, mockResponse)

        await testDestination.refreshAccessToken(settings, {
          accessToken: 'old_token',
          refreshToken: 'refresh_token',
          clientId: 'test_client',
          clientSecret: 'test_secret'
        })

        expect(requestBody?.get('aud')).toBe('https://id.b2b.yahooincapis.com/zts/v1')
        expect(scope.isDone()).toBe(true)
      })

      it('should send JWT as client_assertion with correct assertion type', async () => {
        const mockResponse = {
          access_token: 'token_with_jwt'
        }

        let requestBody: URLSearchParams | undefined

        const scope = nock('https://id.b2b.yahooincapis.com')
          .post('/zts/v1/oauth2/token', (body) => {
            requestBody = new URLSearchParams(body)
            return true
          })
          .reply(200, mockResponse)

        await testDestination.refreshAccessToken(settings, {
          accessToken: 'old_token',
          refreshToken: 'refresh_token',
          clientId: 'test_client',
          clientSecret: 'test_secret'
        })

        expect(requestBody?.get('client_assertion')).toBeDefined()
        expect(requestBody?.get('client_assertion_type')).toBe('urn:ietf:params:oauth:client-assertion-type:jwt-bearer')
        expect(requestBody?.get('grant_type')).toBe('client_credentials')
        expect(scope.isDone()).toBe(true)
      })

      it('should handle JSON-wrapped credentials from vault', async () => {
        const mockResponse = {
          access_token: 'vault_token'
        }

        const jsonClientId = JSON.stringify({ rt_api: 'vault_client_id' })
        const jsonClientSecret = JSON.stringify({ rt_api: 'vault_client_secret' })

        const scope = nock('https://id.b2b.yahooincapis.com').post('/zts/v1/oauth2/token').reply(200, mockResponse)

        const result = await testDestination.refreshAccessToken(settings, {
          accessToken: 'old_token',
          refreshToken: 'refresh_token',
          clientId: jsonClientId,
          clientSecret: jsonClientSecret
        })

        expect(result).toEqual({ accessToken: 'vault_token' })
        expect(scope.isDone()).toBe(true)
      })
    })

    describe('Failure cases', () => {
      it('should handle 401 authentication errors', async () => {
        nock('https://id.b2b.yahooincapis.com').post('/zts/v1/oauth2/token').reply(401, {
          error: 'invalid_client',
          error_description: 'Invalid client credentials'
        })

        await expect(
          testDestination.refreshAccessToken(settings, {
            accessToken: 'old_token',
            refreshToken: 'refresh_token',
            clientId: 'invalid_client',
            clientSecret: 'invalid_secret'
          })
        ).rejects.toThrow()
      })

      it('should handle 400 bad request errors', async () => {
        nock('https://id.b2b.yahooincapis.com').post('/zts/v1/oauth2/token').reply(400, {
          error: 'invalid_request',
          error_description: 'Invalid request parameters'
        })

        await expect(
          testDestination.refreshAccessToken(settings, {
            accessToken: 'old_token',
            refreshToken: 'refresh_token',
            clientId: 'test_client',
            clientSecret: 'test_secret'
          })
        ).rejects.toThrow()
      })
    })
  })

  describe('generate_jwt() function - OAuth 2.0 JWT Generation', () => {
    it('should generate a valid JWT with correct structure', () => {
      const clientId = 'idb2b.dsp.datax.test_client'
      const clientSecret = 'test_secret'

      const jwt = generate_jwt(clientId, clientSecret)

      // JWT should have three parts separated by dots
      const parts = jwt.split('.')
      expect(parts.length).toBe(3)

      // Decode and validate header
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString())
      expect(header.alg).toBe('HS256')
      expect(header.typ).toBe('JWT')

      // Decode and validate payload
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
      expect(payload.iss).toBe(clientId)
      expect(payload.sub).toBe(clientId)
      expect(payload.aud).toBe('https://id.b2b.yahooincapis.com/zts/v1')
      expect(payload.jti).toBeDefined()
      expect(payload.exp).toBeDefined()
      expect(payload.iat).toBeDefined()
      expect(payload.exp).toBeGreaterThan(payload.iat)
      expect(payload.exp - payload.iat).toBe(3600) // 1 hour expiration
    })

    it('should use the correct audience URL in JWT payload', () => {
      const clientId = 'idb2b.dsp.datax.test_client'
      const clientSecret = 'test_secret'

      const jwt = generate_jwt(clientId, clientSecret)
      const parts = jwt.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

      expect(payload.aud).toBe('https://id.b2b.yahooincapis.com/zts/v1')
    })

    it('should generate a valid HMAC signature', () => {
      const clientId = 'idb2b.dsp.datax.test_client'
      const clientSecret = 'test_secret'

      const jwt = generate_jwt(clientId, clientSecret)
      const parts = jwt.split('.')

      // Verify signature
      const headerPayload = parts[0] + '.' + parts[1]
      const expectedSignature = createHmac('sha256', clientSecret).update(headerPayload).digest('base64')

      expect(parts[2]).toBe(expectedSignature)
    })

    it('should include prefixed client ID in iss and sub claims', () => {
      const clientId = 'idb2b.dsp.datax.my_client_123'
      const clientSecret = 'my_secret'

      const jwt = generate_jwt(clientId, clientSecret)
      const parts = jwt.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

      expect(payload.iss).toBe(clientId)
      expect(payload.sub).toBe(clientId)
      expect(clientId.startsWith('idb2b.dsp.datax.')).toBe(true)
    })

    it('should generate unique jti (JWT ID) for each call', () => {
      const clientId = 'idb2b.dsp.datax.test_client'
      const clientSecret = 'test_secret'

      const jwt1 = generate_jwt(clientId, clientSecret)
      const jwt2 = generate_jwt(clientId, clientSecret)

      const payload1 = JSON.parse(Buffer.from(jwt1.split('.')[1], 'base64').toString())
      const payload2 = JSON.parse(Buffer.from(jwt2.split('.')[1], 'base64').toString())

      expect(payload1.jti).not.toBe(payload2.jti)
    })

    it('should set expiration time to 1 hour from issued time', () => {
      const clientId = 'idb2b.dsp.datax.test_client'
      const clientSecret = 'test_secret'

      const beforeGeneration = Math.floor(Date.now() / 1000)
      const jwt = generate_jwt(clientId, clientSecret)
      const afterGeneration = Math.floor(Date.now() / 1000)

      const parts = jwt.split('.')
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

      // iat should be close to current time
      expect(payload.iat).toBeGreaterThanOrEqual(beforeGeneration)
      expect(payload.iat).toBeLessThanOrEqual(afterGeneration)

      // exp should be 3600 seconds (1 hour) after iat
      expect(payload.exp - payload.iat).toBe(3600)
    })
  })

  describe('gen_update_segment_payload() function', () => {
    describe('Success cases', () => {
      it('trivial', () => {
        // Given
        const payloads: Payload[] = [{} as Payload]

        // When
        const result = gen_update_segment_payload(payloads)

        // Then
        expect(result).toBeTruthy()
      })

      it('should group multiple payloads from the same user into one Yahoo event payload', () => {
        // Given
        const payloads: Payload[] = [
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_123',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'bugsbunny@warnerbros.com',
            advertising_id: '',
            phone: '',
            event_attributes: {
              sneakers_buyers: true
            },
            identifier: 'email'
          } as Payload,
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_234',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'bugsbunny@warnerbros.com',
            advertising_id: '',
            phone: '',
            event_attributes: {
              sneakers_buyers: true
            },
            identifier: 'email'
          } as Payload,
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_123',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: 'daffyduck@warnerbros.com',
            advertising_id: '',
            phone: '',
            event_attributes: {
              sneakers_buyers: true
            },
            identifier: 'email'
          } as Payload
        ]
        // When
        const result = gen_update_segment_payload(payloads)
        // Then
        expect(result).toBeTruthy()
        expect(result.data.length).toBe(2)
        expect((result.data as any)[0][4]).toContain(';')
      })

      it('should not rehash if value is already hashed', () => {
        const payloads: Payload[] = [
          {
            gdpr_flag: false,
            segment_audience_id: 'aud_123',
            segment_audience_key: 'sneakers_buyers',
            segment_computation_action: 'enter',
            email: '67e28cdcc3e845d3a4da05ca9fe5ddb7320a83b4cc2167f0555a3b04f63511e3',
            advertising_id: '',
            phone: '',
            event_attributes: {
              sneakers_buyers: true
            },
            identifier: 'email'
          } as Payload
        ]

        const result = gen_update_segment_payload(payloads)
        expect(result.data[0]).toContain('67e28cdcc3e845d3a4da05ca9fe5ddb7320a83b4cc2167f0555a3b04f63511e3')
      })
    })
  })
})
