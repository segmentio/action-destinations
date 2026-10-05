import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import { StatsContext } from '@segment/actions-core/destination-kit'
import Destination from '../index'

const audienceName = 'Test Audience'
const testDestination = createTestIntegration(Destination)

const createAudienceInput = {
  settings: {
    oauth: {
      refresh_token: 'mock-refresh-token'
    }
  },
  audienceName: audienceName,
  audienceSettings: {
    advertiserId: '12345',
    audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
    membershipDurationDays: '30',
    description: 'Test description'
  }
}

const input = (audienceSettings: Record<string, string | undefined> = {}) => ({
  ...createAudienceInput,
  audienceSettings: { ...createAudienceInput.audienceSettings, ...audienceSettings }
})

const getAudienceInput = {
  settings: {
    oauth: {
      refresh_token: 'mock-refresh-token'
    }
  },
  audienceSettings: {
    advertiserId: '12345'
  },
  externalId: 'audience-id-123'
}

// Mock environment variables
beforeAll(() => {
  process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID = 'mock-client-id'
  process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET = 'mock-client-secret'
})

// Mock token request
beforeEach(() => {
  nock('https://www.googleapis.com')
    .post('/oauth2/v4/token', {
      refresh_token: 'mock-refresh-token',
      client_id: 'mock-client-id',
      client_secret: 'mock-client-secret',
      grant_type: 'refresh_token'
    })
    .reply(200, { access_token: 'temp-token' })
})

// Create Audience Tests
describe('Audience Destination', () => {
  describe('createAudience', () => {
    it('creates an audience successfully with CANARY VERSION', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v4/firstPartyAndPartnerAudiences?advertiserId=12345', {
          displayName: audienceName,
          audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
          membershipDurationDays: '30',
          description: 'Test description',
          audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
          firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY'
        })
        .matchHeader('Authorization', 'Bearer temp-token')
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })

      const result = await testDestination.createAudience({
        ...createAudienceInput,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toEqual({ externalId: 'audience-id-123' })
    })

    it('errors out when no advertiser ID is provided', async () => {
      await expect(testDestination.createAudience(input({ advertiserId: '' }))).rejects.toMatchObject({
        message: 'Missing advertiser ID value',
        code: 'MISSING_REQUIRED_FIELD',
        status: 400
      })
    })

    describe('OAuth failure stats', () => {
      const statsContextWith = () => {
        const incr = jest.fn()
        const statsContext = { statsClient: { incr }, tags: ['env:test'] } as unknown as StatsContext
        return { incr, statsContext }
      }

      const expectOAuthStats = (incr: jest.Mock, reason: string) => {
        const tags = ['env:test', 'slug:actions-first-party-dv360']
        expect(incr).toHaveBeenCalledWith('createAudience.call', 1, tags)
        expect(incr).toHaveBeenCalledWith('createAudience.error', 1, [...tags, 'error:oauth', `reason:${reason}`])
      }

      it('records a stat when OAuth credentials are missing', async () => {
        const { incr, statsContext } = statsContextWith()

        await expect(
          testDestination.createAudience({ ...input(), settings: { oauth: {} }, statsContext })
        ).rejects.toThrowError('Oauth credentials missing.')

        expectOAuthStats(incr, 'oauth-credentials-missing')
      })

      it('records a stat when the token request fails', async () => {
        nock.cleanAll()
        nock('https://www.googleapis.com').post('/oauth2/v4/token').reply(400, { error: 'invalid_grant' })
        const { incr, statsContext } = statsContextWith()

        await expect(testDestination.createAudience({ ...input(), statsContext })).rejects.toThrow()

        expectOAuthStats(incr, 'oauth-token-request-failed')
      })
    })
  })

  describe('getAudience', () => {
    it('should succeed with CANARY VERSION', async () => {
      nock('https://displayvideo.googleapis.com')
        .get(`/v4/firstPartyAndPartnerAudiences/audience-id-123?advertiserId=12345`)
        .matchHeader('Authorization', 'Bearer temp-token')
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })

      const result = await testDestination.getAudience({
        ...getAudienceInput,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toEqual({ externalId: 'audience-id-123' })
    })

    it('should fail when the audience ID is missing', async () => {
      const missingIdInput = {
        ...getAudienceInput,
        externalId: ''
      }
      await expect(testDestination.getAudience(missingIdInput)).rejects.toThrowError(
        new IntegrationError('Failed to retrieve audience ID value', 'MISSING_REQUIRED_FIELD', 400)
      )
    })

    it('passes through the error when the audience cannot be read', async () => {
      nock('https://displayvideo.googleapis.com')
        .get('/v4/firstPartyAndPartnerAudiences/audience-id-123?advertiserId=12345')
        .reply(404, { error: { code: 404, message: 'Requested entity was not found.', status: 'NOT_FOUND' } })

      await expect(testDestination.getAudience(getAudienceInput)).rejects.toMatchObject({
        message:
          'Failed to retrieve audience audience-id-123 from Display & Video 360: Requested entity was not found.',
        code: 'GET_AUDIENCE_FAILED',
        status: 404
      })
    })
  })

  describe('createAudience audience settings', () => {
    const DV360_HOST = 'https://displayvideo.googleapis.com'
    const CREATE_PATH = '/v4/firstPartyAndPartnerAudiences?advertiserId=12345'

    afterEach(() => {
      nock.cleanAll()
    })

    it('connects to the Existing Audience ID instead of creating an audience', async () => {
      nock(DV360_HOST)
        .get('/v4/firstPartyAndPartnerAudiences/existing-id?advertiserId=12345')
        .matchHeader('Authorization', 'Bearer temp-token')
        .reply(200, { firstPartyAndPartnerAudienceId: 'existing-id', audienceType: 'CUSTOMER_MATCH_CONTACT_INFO' })

      const result = await testDestination.createAudience(
        input({ existingAudienceId: ' existing-id ', membershipDurationDays: undefined, description: undefined })
      )

      expect(result).toEqual({ externalId: 'existing-id' })
      expect(nock.isDone()).toBe(true)
    })

    it('sends the access token when looking up an audience whose name already exists', async () => {
      nock(DV360_HOST)
        .post(CREATE_PATH)
        .matchHeader('Authorization', 'Bearer temp-token')
        .reply(400, { error: { code: 400, message: `The following display name already exists: "${audienceName}".` } })
      nock(DV360_HOST)
        .get('/v4/firstPartyAndPartnerAudiences')
        .query({ advertiserId: '12345', filter: `displayName:"${audienceName}"` })
        .matchHeader('Authorization', 'Bearer temp-token')
        .reply(200, {
          firstPartyAndPartnerAudiences: [
            {
              firstPartyAndPartnerAudienceId: 'existing-id',
              displayName: audienceName,
              audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
              membershipDurationDays: '30',
              firstPartyAndPartnerAudienceType: 'TYPE_FIRST_PARTY'
            }
          ]
        })

      const result = await testDestination.createAudience(input())

      expect(result).toEqual({ externalId: 'existing-id' })
      expect(nock.isDone()).toBe(true)
    })

    it.each([
      ['uses the Audience Name setting when provided', '  Custom Name  ', 'Custom Name'],
      ['falls back to the Segment audience name when Audience Name is blank', '   ', audienceName]
    ])('%s', async (_title: string, audienceDisplayName: string, expectedName: string) => {
      let body: any
      nock(DV360_HOST)
        .post(CREATE_PATH, (b) => {
          body = b
          return true
        })
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })

      await testDestination.createAudience(input({ audienceDisplayName }))

      expect(body.displayName).toBe(expectedName)
    })
  })

  // Edit Customer Match Members - Contact Info List
  describe('Edit Customer Match Members - Contact Info List', () => {
    const event = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {},
      traits: {
        phone: '1234567890',
        zipCodes: '12345',
        firstName: 'John',
        lastName: 'Doe',
        countryCode: '+1'
      },
      context: {
        traits: {
          email: 'test@gmail.com'
        },
        personas: {
          external_audience_id: 'audience-id-123',
          audience_settings: {
            advertiserId: '12345',
            token: 'temp-token'
          }
        }
      }
    })

    const payloadContactInfo = {
      email: 'test@gmail.com'
    }

    // Journeys sends computation_class: 'journey_step' instead of 'audience'. The perform() functions for
    // addToAudContactInfo/removeFromAudContactInfo never read computation_class (add vs remove is determined
    // solely by which action is invoked), so behavior must be identical to the tests above.
    const journeyStepEvent = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {},
      traits: {
        phone: '1234567890',
        zipCodes: '12345',
        firstName: 'John',
        lastName: 'Doe',
        countryCode: '+1'
      },
      context: {
        traits: payloadContactInfo,
        personas: {
          external_audience_id: 'audience-id-123',
          audience_settings: {
            advertiserId: '12345',
            token: 'temp-token'
          },
          computation_class: 'journey_step'
        }
      }
    })

    it('should add customer match members successfully with journey_step computation_class', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v4/firstPartyAndPartnerAudiences/audience-id-123:editCustomerMatchMembers')
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })
      const result = await testDestination.testAction('addToAudContactInfo', {
        event: journeyStepEvent,
        useDefaultMappings: true,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toContainEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            firstPartyAndPartnerAudienceId: 'audience-id-123'
          })
        })
      )
    })

    it('should remove customer match members successfully with journey_step computation_class', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v4/firstPartyAndPartnerAudiences/audience-id-123:editCustomerMatchMembers', {
          advertiserId: '12345',
          removedContactInfoList: {
            contactInfos: [
              {
                hashedEmails: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674',
                hashedPhoneNumbers: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
                zipCodes: '12345',
                hashedFirstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
                hashedLastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
                countryCode: '+1'
              }
            ],
            consent: {
              adUserData: 'CONSENT_STATUS_GRANTED',
              adPersonalization: 'CONSENT_STATUS_GRANTED'
            }
          }
        })
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })

      const result = await testDestination.testAction('removeFromAudContactInfo', {
        event: journeyStepEvent,
        useDefaultMappings: true,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toContainEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            firstPartyAndPartnerAudienceId: 'audience-id-123'
          })
        })
      )
    })

    it('should add customer match members successfully with CANARY VERSION', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v4/firstPartyAndPartnerAudiences/audience-id-123:editCustomerMatchMembers')
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })
      const result = await testDestination.testAction('addToAudContactInfo', {
        event,
        useDefaultMappings: true,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toContainEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            firstPartyAndPartnerAudienceId: 'audience-id-123'
          })
        })
      )
    })
    it('should remove customer match members successfully with CANARY VERSION', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v4/firstPartyAndPartnerAudiences/audience-id-123:editCustomerMatchMembers', {
          advertiserId: '12345',
          removedContactInfoList: {
            contactInfos: [
              {
                hashedEmails: '87924606b4131a8aceeeae8868531fbb9712aaa07a5d3a756b26ce0f5d6ca674',
                hashedPhoneNumbers: 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646',
                zipCodes: '12345',
                hashedFirstName: '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a',
                hashedLastName: '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f',
                countryCode: '+1'
              }
            ],
            consent: {
              adUserData: 'CONSENT_STATUS_GRANTED',
              adPersonalization: 'CONSENT_STATUS_GRANTED'
            }
          }
        })
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })

      const result = await testDestination.testAction('removeFromAudContactInfo', {
        event,
        useDefaultMappings: true,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toContainEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            firstPartyAndPartnerAudienceId: 'audience-id-123'
          })
        })
      )
    })
  })

  // Edit Customer Match Members - Mobile Device ID List
  describe('Edit Customer Match Members - Mobile Device ID List', () => {
    const payloadDeviceId = {
      mobileDeviceIds: '123'
    }

    const event = createTestEvent({
      event: 'Audience Entered',
      type: 'track',
      properties: {},
      context: {
        traits: payloadDeviceId,
        personas: {
          external_audience_id: 'audience-id-123',
          audience_settings: {
            advertiserId: '12345',
            token: 'temp-token'
          }
        }
      }
    })

    it('should add customer match members successfully with CANARY VERSION', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v4/firstPartyAndPartnerAudiences/audience-id-123:editCustomerMatchMembers', {
          advertiserId: '12345',
          addedMobileDeviceIdList: {
            mobileDeviceIds: ['123'],
            consent: {
              adUserData: 'CONSENT_STATUS_GRANTED',
              adPersonalization: 'CONSENT_STATUS_GRANTED'
            }
          }
        })
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })

      const result = await testDestination.testAction('addToAudMobileDeviceId', {
        event,
        useDefaultMappings: true,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toContainEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            firstPartyAndPartnerAudienceId: 'audience-id-123'
          })
        })
      )
    })

    it('should remove customer match members successfully with CANARY VERSION', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v4/firstPartyAndPartnerAudiences/audience-id-123:editCustomerMatchMembers', {
          advertiserId: '12345',
          removedMobileDeviceIdList: {
            mobileDeviceIds: ['123'],
            consent: {
              adUserData: 'CONSENT_STATUS_GRANTED',
              adPersonalization: 'CONSENT_STATUS_GRANTED'
            }
          }
        })
        .reply(200, { firstPartyAndPartnerAudienceId: 'audience-id-123' })

      const result = await testDestination.testAction('removeFromAudMobileDeviceId', {
        event,
        useDefaultMappings: true,
        features: { 'first-party-dv360-canary-version': true }
      })
      expect(result).toContainEqual(
        expect.objectContaining({
          data: expect.objectContaining({
            firstPartyAndPartnerAudienceId: 'audience-id-123'
          })
        })
      )
    })
  })
})
