import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'
import { GET_AUDIENCE_URL, CREATE_AUDIENCE_URL, OAUTH_URL } from '../constants'

const advertiserId = '424242'
const audienceName = 'The Super Mario Brothers Fans'
const testDestination = createTestIntegration(Destination)
const advertiserCreateAudienceUrl = CREATE_AUDIENCE_URL.replace('advertiserID', advertiserId)
const advertiserGetAudienceUrl = GET_AUDIENCE_URL.replace('advertiserID', advertiserId)
const expectedExternalID = `products/DISPLAY_VIDEO_ADVERTISER/customers/${advertiserId}/userLists/8457147615`
const accountType = 'DISPLAY_VIDEO_ADVERTISER'

const createAudienceInput = {
  settings: {},
  audienceName: '',
  audienceSettings: {
    advertiserId: advertiserId,
    accountType: accountType
  }
}

const getAudienceInput = {
  settings: {},
  audienceSettings: {
    advertiserId: advertiserId,
    accountType: accountType
  },
  audienceName: audienceName,
  externalId: expectedExternalID
}

const getAudienceResponse = [
  {
    results: [
      {
        userList: {
          resourceName: expectedExternalID,
          membershipStatus: 'OPEN',
          name: audienceName,
          description: 'Created by Segment.'
        }
      }
    ],
    fieldMask: 'userList.name,userList.description,userList.membershipStatus,userList.matchRatePercentage',
    requestId: 'Hw7-_h0P-vCzQ'
  }
]

describe('Display Video 360', () => {
  beforeEach(() => {
    process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_ID = 'Clientz'
    process.env.ACTIONS_DISPLAY_VIDEO_360_CLIENT_SECRET = 'Scretz'
    process.env.ACTIONS_DISPLAY_VIDEO_360_REFRESH_TOKEN = 'Freshy'
  })

  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no advertiser ID is set', async () => {
      createAudienceInput.audienceName = 'The Void'
      createAudienceInput.audienceSettings.advertiserId = ''
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('creates an audience', async () => {
      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(advertiserCreateAudienceUrl)
        .post(/.*/)
        .reply(200, {
          results: [
            {
              resourceName: `products/DISPLAY_VIDEO_ADVERTISER/customers/${advertiserId}/userLists/8460733279`
            }
          ]
        })

      createAudienceInput.audienceName = audienceName
      createAudienceInput.audienceSettings.advertiserId = advertiserId

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({
        externalId: `products/DISPLAY_VIDEO_ADVERTISER/customers/${advertiserId}/userLists/8460733279`
      })
    })

    it('should work when advertiserId starts or ends with a space', async () => {
      createAudienceInput.audienceName = audienceName
      createAudienceInput.audienceSettings.advertiserId = '                424242'

      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(advertiserCreateAudienceUrl)
        .post(/.*/)
        .reply(200, {
          results: [
            {
              resourceName: `products/DISPLAY_VIDEO_ADVERTISER/customers/${advertiserId}/userLists/8460733279`
            }
          ]
        })
      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({
        externalId: `products/DISPLAY_VIDEO_ADVERTISER/customers/424242/userLists/8460733279`
      })
    })

    it('errors out when audience with same name already exists', async () => {
      nock(advertiserCreateAudienceUrl)
        .post(/.*/)
        .reply(400, {
          error: {
            code: 400,
            message: 'Request contains an invalid argument.',
            status: 'INVALID_ARGUMENT',
            details: [
              {
                '@type': 'type.googleapis.com/google.ads.audiencepartner.v2.errors.AudiencePartnerFailure',
                errors: [
                  {
                    errorCode: {
                      userListError: 'NAME_ALREADY_USED'
                    },
                    message: 'Name is already being used for another user list for the account.',
                    trigger: {
                      stringValue: audienceName
                    },
                    location: {
                      fieldPathElements: [
                        {
                          fieldName: 'operations',
                          index: 0
                        },
                        {
                          fieldName: 'create'
                        },
                        {
                          fieldName: 'name'
                        }
                      ]
                    }
                  }
                ],
                requestId: 'gMjeoMWem82kFnHKBnmzsA'
              }
            ]
          }
        })

      createAudienceInput.audienceName = audienceName
      createAudienceInput.audienceSettings.advertiserId = advertiserId

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })
  })

  describe('getAudience', () => {
    it("should fail if Segment Audience ID doesn't match Google Audience ID", async () => {
      const bogusGetAudienceInput = {
        ...getAudienceInput,
        externalId: 'bogus'
      }

      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(advertiserGetAudienceUrl).post(/.*/).reply(200, getAudienceResponse)
      await expect(testDestination.getAudience(bogusGetAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('should succeed when Segment Audience ID matches Google audience ID', async () => {
      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(advertiserGetAudienceUrl).post(/.*/).reply(200, getAudienceResponse)

      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({
        externalId: expectedExternalID
      })
    })

    it('should work when advertiserId starts or ends with a space', async () => {
      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(advertiserGetAudienceUrl).post(/.*/).reply(200, getAudienceResponse)

      getAudienceInput.audienceSettings.advertiserId = '                424242  '
      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({
        externalId: expectedExternalID
      })
    })

    it('should succeed when the destination instance is flagged as a migration instance', async () => {
      // Migrations are now using the OAUTH flow since the credentials belong to Segment and are kept in chamber.
      // This test is pretty much the same as the previous one, but I'm leaving it here for clarity.

      const migrationGetAudienceInput = {
        ...getAudienceInput,
        externalId: expectedExternalID
      }

      nock(OAUTH_URL).post(/.*/).reply(200, { access_token: 'tok3n' })
      nock(advertiserGetAudienceUrl).post(/.*/).reply(200, getAudienceResponse)

      const r = await testDestination.getAudience(migrationGetAudienceInput)
      expect(r).toEqual({
        externalId: expectedExternalID
      })
    })
  })
})
