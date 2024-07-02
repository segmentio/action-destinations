import nock from 'nock'
import { createTestIntegration, InvalidAuthenticationError } from '@segment/actions-core'
import Definition from '../index'
import { HTTPError } from '@segment/actions-core/*'
import { AUTHORIZATION_URL } from '../utils'

const testDestination = createTestIntegration(Definition)

export const settings = {
  region: 'https://advertising-api.amazon.com'
}

const validSettings = {
  region: 'https://advertising-api.amazon.com',
  oauth: {
    access_token: 'valid token',
    refresh_token: '123'
  }
}
const audienceSettings = {
  advertiserId: '1234567893456754321',
  countryCode: 'US',
  description: 'Test Audience Description',
  externalAudienceId: 'external-audience-123456'
}
const createAudienceInputTemp = {
  settings,
  audienceSettings: audienceSettings,
  audienceName: 'Test Audience'
}

const getAudienceInput = {
  settings,
  externalId: '1234549079612618'
}

describe('Amazon-Ads (actions)', () => {
  describe('testAuthentication', () => {
    it('should not throw an error if all the appropriate credentials are available', async () => {
      nock(`${settings.region}`).get('/v2/profiles').matchHeader('content-type', 'application/json').reply(200, {})
      await expect(testDestination.testAuthentication(validSettings)).resolves.not.toThrowError()
    })

    it('should throw an error if the user has not completed the oauth flow', async () => {
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError(
        'Credentials are invalid:  Please authenticate via Oauth before enabling the destination.'
      )
    })

    it('should throw an error if the oauth token is invalid', async () => {
      nock(`${settings.region}`).get('/v2/profiles').reply(401)

      await expect(testDestination.testAuthentication(validSettings)).rejects.toThrowError(
        'Credentials are invalid:  Invalid Amazon Oauth access token. Please reauthenticate to retrieve a valid access token before enabling the destination.'
      )
    })
  })

  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      const createAudienceInput = {
        ...createAudienceInputTemp,
        audienceName: ''
      }
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(
        'Missing audienceName Value'
      )
    })

    it('should fail if advertiserId is missing in audienceSettings', async () => {
      const createAudienceInput = {
        ...createAudienceInputTemp,
        audienceSettings: {
          ...audienceSettings,
          advertiserId: ''
        }
      }
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(
        'Missing advertiserId Value'
      )
    })
    it('should fail if externalAudienceId is missing in audienceSettings', async () => {
      const createAudienceInput = {
        ...createAudienceInputTemp,
        audienceSettings: {
          ...audienceSettings,
          externalAudienceId: ''
        }
      }
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(
        'Missing externalAudienceId Value'
      )
    })
    it('should fail if countryCode is missing in audienceSettings', async () => {
      const createAudienceInput = {
        ...createAudienceInputTemp,
        audienceSettings: {
          ...audienceSettings,
          countryCode: ''
        }
      }
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(
        'Missing countryCode Value'
      )
    })
    it('should fail if description is missing in audienceSettings', async () => {
      const createAudienceInput = {
        ...createAudienceInputTemp,
        audienceSettings: {
          ...audienceSettings,
          description: ''
        }
      }
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(
        'Missing description Value'
      )
    })

    it('should fail if refresh token API gets failed', async () => {
      const endpoint = AUTHORIZATION_URL[`${settings.region}`]
      nock(`${endpoint}`).post('/auth/o2/token').reply(401)

      await expect(testDestination.createAudience(createAudienceInputTemp)).rejects.toThrowError(
        InvalidAuthenticationError
      )
    })

    it('should throw an HTTPError when createAudience API response is not ok', async () => {
      const endpoint = AUTHORIZATION_URL[`${settings.region}`]
      nock(`${endpoint}`).post('/auth/o2/token').reply(200)

      nock(`${settings.region}`)
        .post('/amc/audiences/metadata')
        .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
        .reply(400)

      await expect(testDestination.createAudience(createAudienceInputTemp)).rejects.toThrowError('Bad Request')
    })

    it('creates an audience', async () => {
      const endpoint = AUTHORIZATION_URL[`${settings.region}`]
      nock(`${endpoint}`).post('/auth/o2/token').reply(200)

      nock(`${settings.region}`)
        .post('/amc/audiences/metadata')
        .matchHeader('content-type', 'application/vnd.amcaudiences.v1+json')
        .reply(200, { audienceId: 1234549079612618, externalAudienceId: 'external-audience-123456' })

      const createAudienceInput = {
        settings,
        audienceName: 'Test Audience',
        audienceSettings: {
          ...audienceSettings,
          ttl: 12345678,
          currency: 'USD',
          cpmCents: 1234
        }
      }

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toMatchSnapshot()
      expect(r).toEqual({
        externalId: '1234549079612618'
      })
    })
  })

  describe('getAudience', () => {
    const externalId = getAudienceInput.externalId
    it('should succeed when with valid audienceId', async () => {
      const endpoint = AUTHORIZATION_URL[`${settings.region}`]
      nock(`${endpoint}`).post('/auth/o2/token').reply(200)

      nock(`${settings.region}/amc/audiences/metadata`)
        .get(`/${externalId}`)
        .reply(200, {
          advertiserId: 1234567893456754321,
          audienceId: 1234549079612618,
          countryCode: 'US',
          description: 'Test Audience Description',
          metadata: {
            audienceFees: [],
            audienceSize: { dspAudienceSize: -1, idResolutionCount: -1, receivedRecordSize: -1 },
            externalAudienceId: 'external-audience-123456',
            ttl: 34190000
          },
          name: 'Test Audience'
        })
      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({
        externalId: '1234549079612618'
      })
    })

    it('should throw an HTTPError when getAudience API response is not ok', async () => {
      const endpoint = AUTHORIZATION_URL[`${settings.region}`]
      nock(`${endpoint}`).post('/auth/o2/token').reply(200)

      nock(`${settings.region}/amc/audiences/metadata`)
        .get(`/${externalId}`)
        .reply(404, { message: 'audienceId not found' })

      const audiencePromise = testDestination.getAudience(getAudienceInput)
      await expect(audiencePromise).rejects.toThrow(HTTPError)
      await expect(audiencePromise).rejects.toHaveProperty('response.statusText', 'Not Found')
      await expect(audiencePromise).rejects.toHaveProperty('response.status', 404)
    })
    it('should fail if refresh token API gets failed ', async () => {
      const endpoint = AUTHORIZATION_URL[`${settings.region}`]
      nock(`${endpoint}`).post('/auth/o2/token').reply(401)

      const audiencePromise = testDestination.getAudience(getAudienceInput)
      await expect(audiencePromise).rejects.toThrow(InvalidAuthenticationError)
    })

    it('should throw an IntegrationError when the audienceId is not provided', async () => {
      getAudienceInput.externalId = ''
      const audiencePromise = testDestination.getAudience(getAudienceInput)
      await expect(audiencePromise).rejects.toThrow('Missing audienceId value')
    })
  })
})
