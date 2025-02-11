import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'

const audienceName = 'Test Audience'
const testDestination = createTestIntegration(Destination)

const createAudienceInput = {
  settings: {},
  audienceName: audienceName,
  audienceSettings: {
    // Using audienceSettings as specified
    advertiserId: '12345',
    audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
    membershipDurationDays: '30',
    token: 'temp-token',
    description: 'Test description'
  }
}

const getAudienceInput = {
  settings: {},
  audienceSettings: {
    advertiserId: '12345',
    token: 'temp-token'
  },
  externalId: 'audience-id-123'
}

// Mock environment variables
beforeAll(() => {
  process.env.ACTIONS_FIRST_PARTY_DV360_REFRESH_TOKEN = 'mock-refresh-token'
  process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_ID = 'mock-client-id'
  process.env.ACTIONS_FIRST_PARTY_DV360_CLIENT_SECRET = 'mock-client-secret'
})

// Mock token request
beforeEach(() => {
  nock('https://accounts.google.com')
    .post('/o/oauth2/token', {
      refresh_token: 'mock-refresh-token',
      client_id: 'mock-client-id',
      client_secret: 'mock-client-secret',
      grant_type: 'refresh_token'
    })
    .reply(200, { access_token: 'temp-token' })
})

//Create Audience Tests

describe('Audience Destination', () => {
  describe('createAudience', () => {
    it('creates an audience successfully', async () => {
      nock('https://displayvideo.googleapis.com')
        .post('/v3/firstAndThirdPartyAudiences?advertiserId=12345', {
          displayName: audienceName,
          audienceType: 'CUSTOMER_MATCH_CONTACT_INFO',
          membershipDurationDays: '30',
          description: 'Test description',
          audienceSource: 'AUDIENCE_SOURCE_UNSPECIFIED',
          firstAndThirdPartyAudienceType: 'FIRST_AND_THIRD_PARTY_AUDIENCE_TYPE_FIRST_PARTY'
        })
        .matchHeader('Authorization', 'Bearer temp-token')
        .reply(200, { firstAndThirdPartyAudienceId: 'audience-id-123' })

      const result = await testDestination.createAudience(createAudienceInput)
      expect(result).toEqual({ externalId: 'audience-id-123' })
    })

    it('errors out when no advertiser ID is provided', async () => {
      createAudienceInput.audienceSettings.advertiserId = ''

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })
  })

  //Get Audience Tests

  describe('getAudience', () => {
    it('should succeed when provided with a valid audience ID', async () => {
      nock('https://displayvideo.googleapis.com')
        .get(`/v3/firstAndThirdPartyAudiences/audience-id-123?advertiserId=12345`)
        .matchHeader('Authorization', 'Bearer temp-token')
        .reply(200, {
          firstAndThirdPartyAudienceId: 'audience-id-123'
        })

      const result = await testDestination.getAudience(getAudienceInput)
      expect(result).toEqual({ externalId: 'audience-id-123' })
    })

    it('should fail when the audience ID is missing', async () => {
      const missingIdInput = {
        ...getAudienceInput,
        externalId: '' // Simulate missing audience ID
      }

      await expect(testDestination.getAudience(missingIdInput)).rejects.toThrowError(
        new IntegrationError('Failed to retrieve audience ID value', 'MISSING_REQUIRED_FIELD', 400)
      )
    })
  })
})

//Payloads for editing customer match list

const payloadContactInfo = {
  emails: 'test@gmail.com',
  phoneNumbers: '1234567890',
  zipCodes: '12345',
  firstName: 'John',
  lastName: 'Doe',
  countryCode: '+1'
}

const payloadDeviceId = {
  mobileDeviceIds: '123'
}

//Edit Customer Match Members - Contact Info List

describe('Edit Customer Match Members - Contact Info List', () => {
  const event = createTestEvent({
    event: 'Audience Entered',
    type: 'track',
    properties: {},
    context: {
      traits: payloadContactInfo,
      personas: {
        external_audience_id: 'audience-id-123',
        audience_settings: {
          advertiserId: '12345',
          token: 'temp-token'
        }
      }
    }
  })
  it('should add customer match members successfully', async () => {
    nock('https://displayvideo.googleapis.com')
      .post('/v3/firstAndThirdPartyAudiences/audience-id-123:editCustomerMatchMembers', {
        advertiserId: '12345',
        addedContactInfoList: {
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
      .matchHeader('Authorization', 'Bearer temp-token')
      .reply(200, { firstAndThirdPartyAudienceId: 'audience-id-123' })
    const result = await testDestination.testAction('addToAudContactInfo', {
      event,
      useDefaultMappings: true
    })
    expect(result).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          firstAndThirdPartyAudienceId: 'audience-id-123'
        })
      })
    )
  })
  it('should remove customer match members successfully', async () => {
    nock('https://displayvideo.googleapis.com')
      .post('/v3/firstAndThirdPartyAudiences/audience-id-123:editCustomerMatchMembers', {
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
      .matchHeader('Authorization', 'Bearer temp-token')
      .reply(200, { firstAndThirdPartyAudienceId: 'audience-id-123' })
    const result = await testDestination.testAction('removeFromAudContactInfo', {
      event,
      useDefaultMappings: true
    })
    expect(result).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          firstAndThirdPartyAudienceId: 'audience-id-123'
        })
      })
    )
  })
})

//Edit Customer Match Members - Mobile Device ID List

describe('Edit Customer Match Members - Mobile Device ID List', () => {
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
  it('should remove customer match members successfully', async () => {
    nock('https://displayvideo.googleapis.com')
      .post('/v3/firstAndThirdPartyAudiences/audience-id-123:editCustomerMatchMembers', {
        advertiserId: '12345',
        addedMobileDeviceIdList: {
          mobileDeviceIds: ['123'],
          consent: {
            adUserData: 'CONSENT_STATUS_GRANTED',
            adPersonalization: 'CONSENT_STATUS_GRANTED'
          }
        }
      })
      .matchHeader('Authorization', 'Bearer temp-token')
      .reply(200, { firstAndThirdPartyAudienceId: 'audience-id-123' })
    const result = await testDestination.testAction('addToAudMobileDeviceId', {
      event,
      useDefaultMappings: true
    })
    expect(result).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          firstAndThirdPartyAudienceId: 'audience-id-123'
        })
      })
    )
  })
  it('should remove customer match members successfully', async () => {
    nock('https://displayvideo.googleapis.com')
      .post('/v3/firstAndThirdPartyAudiences/audience-id-123:editCustomerMatchMembers', {
        advertiserId: '12345',
        removedMobileDeviceIdList: {
          mobileDeviceIds: ['123'],
          consent: {
            adUserData: 'CONSENT_STATUS_GRANTED',
            adPersonalization: 'CONSENT_STATUS_GRANTED'
          }
        }
      })
      .matchHeader('Authorization', 'Bearer temp-token')
      .reply(200, { firstAndThirdPartyAudienceId: 'audience-id-123' })
    const result = await testDestination.testAction('removeFromAudMobileDeviceId', {
      event,
      useDefaultMappings: true
    })
    expect(result).toContainEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          firstAndThirdPartyAudienceId: 'audience-id-123'
        })
      })
    )
  })
})
