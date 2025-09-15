import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'

const audienceName = 'The Best Test Audience'
const folderName = 'Test Folder'
const clientId = 'test_client_id'
const clientSecret = 'test_client_secret'
const apiEndpoint = 'https://123-ABC-456.mktorest.com'
const testDestination = createTestIntegration(Destination)

const createAudienceInput = {
  settings: {
    folder_name: folderName,
    client_id: clientId,
    client_secret: clientSecret,
    api_endpoint: apiEndpoint
  },
  audienceName: ''
}

const getAudienceInput = {
  settings: {
    folder_name: folderName,
    client_id: clientId,
    client_secret: clientSecret,
    api_endpoint: apiEndpoint
  },
  audienceName: audienceName,
  externalId: '782'
}

describe('Marketo Static Lists', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })

    it('creates an audience', async () => {
      nock(
        `${apiEndpoint}/identity/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
      )
        .post(/.*/)
        .reply(200, {
          access_token: 'access_token'
        })

      nock(`${apiEndpoint}/rest/asset/v1/folder/byName.json?name=${encodeURIComponent(folderName)}`)
        .get(/.*/)
        .reply(200, {
          success: true,
          result: [
            {
              name: folderName,
              id: 12
            }
          ]
        })

      nock(`${apiEndpoint}/rest/asset/v1/staticLists.json?folder=12&name=${encodeURIComponent(audienceName)}`)
        .post(/.*/)
        .reply(200, {
          success: true,
          result: [
            {
              name: audienceName,
              id: 782
            }
          ]
        })

      createAudienceInput.audienceName = audienceName

      const r = await testDestination.createAudience(createAudienceInput)
      expect(r).toEqual({
        externalId: '782'
      })
    })

    it('errors out when audience with same name already exists', async () => {
      nock(
        `${apiEndpoint}/identity/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
      )
        .post(/.*/)
        .reply(200, {
          access_token: 'access_token'
        })

      nock(`${apiEndpoint}/rest/asset/v1/folder/byName.json?name=${encodeURIComponent(folderName)}`)
        .get(/.*/)
        .reply(200, {
          success: true,
          result: [
            {
              name: folderName,
              id: 12
            }
          ]
        })

      nock(`${apiEndpoint} /rest/asset/v1/staticLists.json`)
        .post(/.*/)
        .reply(200, {
          success: false,
          errors: [
            {
              code: '709',
              message: 'Static List with the same name already exists'
            }
          ]
        })

      createAudienceInput.audienceName = audienceName

      await expect(testDestination.createAudience(createAudienceInput)).rejects.toThrowError(IntegrationError)
    })
  })

  describe('getAudience', () => {
    it('should succeed when with valid list id', async () => {
      nock(
        `${apiEndpoint}/identity/oauth/token?grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
      )
        .post(/.*/)
        .reply(200, {
          access_token: 'access_token'
        })
      nock(`${apiEndpoint}/rest/asset/v1/staticList/782.json`)
        .get(/.*/)
        .reply(200, {
          success: true,
          result: [
            {
              name: folderName,
              id: 782
            }
          ]
        })

      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({
        externalId: '782'
      })
    })
  })
})
