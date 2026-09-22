import nock from 'nock'
import { createTestIntegration, IntegrationError } from '@segment/actions-core'
import Destination from '../index'
import { API_VERSION, BASE_URL } from '../constants'

const adAccountId = '1500000000000000'
const audienceId = '1506489116128966'
const testDestination = createTestIntegration(Destination)

const getAudienceUrl = `${BASE_URL}/${API_VERSION}/`

const getAudienceInput = {
  externalId: audienceId,
  settings: {
    retlAdAccountId: '123'
  }
}

const baseCreateAudienceInput = () => ({
  settings: {
    retlAdAccountId: '123'
  },
  audienceName: '',
  audienceSettings: {
    engageAdAccountId: adAccountId,
    audienceDescription: 'We are the Mario Brothers and plumbing is our game.' as string | undefined,
    audienceLabel: undefined as string | undefined,
    existingAudienceId: undefined as string | undefined
  },
  features: {}
})

describe('Facebook Custom Audiences', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      const error = await testDestination.createAudience(baseCreateAudienceInput()).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain('required value(s) were not provided: "Audience Name"')
    })

    it('should fail if no ad account ID is set', async () => {
      const input = baseCreateAudienceInput()
      input.audienceName = 'The Void'
      input.audienceSettings.engageAdAccountId = ''
      input.settings.retlAdAccountId = ''

      const error = await testDestination.createAudience(input).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain('required value(s) were not provided: "Advertiser Account ID"')
    })

    it('should name every missing required value when more than one is absent', async () => {
      const input = baseCreateAudienceInput()
      input.audienceSettings.engageAdAccountId = ''
      input.settings.retlAdAccountId = ''

      const error = await testDestination.createAudience(input).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain('required value(s) were not provided: "Audience Name", "Advertiser Account ID"')
      expect(error.message).toContain('"Existing Audience ID"')
    })

    it('should not require an ad account ID when connecting to an existing audience', async () => {
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .query({ fields: 'id,name' })
        .reply(200, { id: audienceId, name: 'The Super Mario Brothers Fans' })

      const input = baseCreateAudienceInput()
      input.audienceSettings.engageAdAccountId = ''
      input.settings.retlAdAccountId = ''
      input.audienceSettings.existingAudienceId = audienceId

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: audienceId })
    })

    it('should create a new Facebook Audience', async () => {
      let requestBody: Record<string, unknown> = {}
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences', (body) => {
          requestBody = body
          return true
        })
        .reply(200, { id: '88888888888888888' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: '88888888888888888' })
      expect(requestBody).not.toHaveProperty('audience_labels')
    })

    it('should include audience_labels when an audience label is set', async () => {
      let requestBody: Record<string, unknown> = {}
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences', (body) => {
          requestBody = body
          return true
        })
        .reply(200, { id: '88888888888888888' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.audienceLabel = 'HIGH_VALUE_CUSTOMERS'

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: '88888888888888888' })
      expect(requestBody.audience_labels).toEqual(['HIGH_VALUE_CUSTOMERS'])
    })

    it('should reject an audience label value outside the predefined choices', async () => {
      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.audienceLabel = 'NOT_A_REAL_LABEL'

      await expect(testDestination.createAudience(input)).rejects.toThrow()
    })

    it('should use error_user_title and error_user_msg when both are present', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(400, {
          error: {
            message: 'Invalid parameter',
            type: 'OAuthException',
            code: 100,
            error_user_title: 'Update Restricted Fields and Rule',
            error_user_msg: 'This custom audience has integrity restrictions.'
          }
        })

      const input = baseCreateAudienceInput()
      input.audienceName = 'Restricted Audience'

      await expect(testDestination.createAudience(input)).rejects.toThrow(
        'error_user_title: "Update Restricted Fields and Rule". error_user_msg: "This custom audience has integrity restrictions.". fbmessage: "Invalid parameter". message: "Bad Request". code: "100"'
      )
    })

    it('should use error_user_msg alone when error_user_title is absent', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(400, {
          error: {
            message: 'Invalid parameter',
            type: 'OAuthException',
            code: 100,
            error_user_msg: 'This custom audience has integrity restrictions.'
          }
        })

      const input = baseCreateAudienceInput()
      input.audienceName = 'Restricted Audience'

      await expect(testDestination.createAudience(input)).rejects.toThrow(
        'This custom audience has integrity restrictions.'
      )
    })

    it('should fall back to the raw message when no user-facing fields are present', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(400, {
          error: {
            message: 'Invalid parameter',
            type: 'OAuthException',
            code: 100
          }
        })

      const input = baseCreateAudienceInput()
      input.audienceName = 'Restricted Audience'

      await expect(testDestination.createAudience(input)).rejects.toThrow('Invalid parameter')
    })

    it('should throw a detailed error when audience creation fails', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(400, {
          error: {
            message: 'Invalid parameter',
            error_user_title: 'Ad account is not authorized',
            code: 100
          }
        })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'

      const error = await testDestination.createAudience(input).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain(
        `Could not create a new Facebook Custom Audience named "The Super Mario Brothers Fans" in ad account ${adAccountId}`
      )
      expect(error.message).toContain('Ad account is not authorized')
    })

    it('should connect to an existing audience without creating a new one', async () => {
      const createScope = nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .query({ fields: 'id,name' })
        .reply(200, { id: audienceId, name: 'The Super Mario Brothers Fans' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.existingAudienceId = audienceId

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: audienceId })
      expect(createScope.isDone()).toBe(false)
    })

    it('should connect to an existing audience even when a description and label are set', async () => {
      const createScope = nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .query({ fields: 'id,name' })
        .reply(200, { id: audienceId, name: 'The Super Mario Brothers Fans' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.audienceLabel = 'ENGAGED_USERS'
      input.audienceSettings.existingAudienceId = audienceId

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: audienceId })
      expect(createScope.isDone()).toBe(false)
    })

    it('should trim whitespace from a pasted existing audience ID', async () => {
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .query({ fields: 'id,name' })
        .reply(200, { id: audienceId, name: 'The Super Mario Brothers Fans' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.existingAudienceId = `  ${audienceId}\n`

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: audienceId })
    })

    it('should create a new audience when the existing audience ID is only whitespace', async () => {
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.existingAudienceId = '   '

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: '88888888888888888' })
    })

    it('should fail if no description is set when creating a new audience', async () => {
      const createScope = nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.audienceDescription = undefined

      const error = await testDestination.createAudience(input).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain('required value(s) were not provided: "Description"')
      expect(createScope.isDone()).toBe(false)
    })

    it('should fail if the description is only whitespace when creating a new audience', async () => {
      const createScope = nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.audienceDescription = '   '

      const error = await testDestination.createAudience(input).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain('required value(s) were not provided: "Description"')
      expect(createScope.isDone()).toBe(false)
    })

    it('should fail if the ad account ID is only whitespace', async () => {
      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.engageAdAccountId = '   '

      const error = await testDestination.createAudience(input).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain('required value(s) were not provided: "Advertiser Account ID"')
    })

    it('should trim whitespace from the description and the ad account ID', async () => {
      let requestBody: Record<string, unknown> = {}
      nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences', (body) => {
          requestBody = body
          return true
        })
        .reply(200, { id: '88888888888888888' })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.engageAdAccountId = `  ${adAccountId}\n`
      input.audienceSettings.audienceDescription = '  Plumbing is our game.  '

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: '88888888888888888' })
      expect(requestBody).toMatchObject({ description: 'Plumbing is our game.' })
    })

    it('should not require a description when connecting to an existing audience', async () => {
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .query({ fields: 'id,name' })
        .reply(200, { id: audienceId, name: 'The Super Mario Brothers Fans' })

      const input = baseCreateAudienceInput()
      input.audienceSettings.audienceDescription = undefined
      input.audienceSettings.existingAudienceId = audienceId

      const r = await testDestination.createAudience(input)
      expect(r).toEqual({ externalId: audienceId })
    })

    it('should throw a detailed error if the existing audience ID does not exist', async () => {
      const createScope = nock(`${BASE_URL}/${API_VERSION}/act_${adAccountId}`)
        .post('/customaudiences')
        .reply(200, { id: '88888888888888888' })
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .query({ fields: 'id,name' })
        .reply(400, {
          error: {
            message: 'Unsupported get request. Object with ID does not exist',
            type: 'GraphMethodException',
            code: 100
          }
        })

      const input = baseCreateAudienceInput()
      input.audienceName = 'The Super Mario Brothers Fans'
      input.audienceSettings.existingAudienceId = audienceId

      const error = await testDestination.createAudience(input).catch((e) => e)
      expect(error).toBeInstanceOf(IntegrationError)
      expect(error.message).toContain(
        `Could not connect to the existing Facebook Custom Audience with ID "${audienceId}"`
      )
      expect(error.message).toContain('Unsupported get request. Object with ID does not exist')
      expect(createScope.isDone()).toBe(false)
    })
  })

  describe('getAudience', () => {
    it('should fail if FB replies with an error ID', async () => {
      nock(getAudienceUrl).get(`/${audienceId}`).query({ fields: 'id,name' }).reply(400, {})
      await expect(testDestination.getAudience(getAudienceInput)).rejects.toThrowError()
    })

    it("should fail if Segment Audience ID doesn't match FB Audience ID", async () => {
      nock(getAudienceUrl).get(`/${audienceId}`).query({ fields: 'id,name' }).reply(200, { id: '42' })
      await expect(testDestination.getAudience(getAudienceInput)).rejects.toThrowError()
    })

    it('should succeed when Segment Audience ID matches FB audience ID', async () => {
      nock(getAudienceUrl)
        .get(`/${audienceId}`)
        .query({ fields: 'id,name' })
        .reply(200, { id: `${audienceId}` })
      const r = await testDestination.getAudience(getAudienceInput)
      expect(r).toEqual({ externalId: audienceId })
    })
  })
})
