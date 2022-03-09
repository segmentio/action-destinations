import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { patchAudience, getAdvertiserAudiences, getAudienceId, createAudience } from '../criteo-audiences'
import type { RequestFn, ClientCredentials, Operation } from '../criteo-audiences'
const testDestination = createTestIntegration(Definition)

//valid destination fields
const settings = {
  client_id: 'valid test_id',
  client_secret: 'valid test_secret',
  advertiser_id: 'valid advertiser id'
}

const credentials = {
  client_id: 'valid test_id',
  client_secret: 'valid test_secret',
}

describe('Criteo-Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate valid auth token', async () => {
      nock('https://api.criteo.com').post('/oauth2/token').reply(200)
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError() //import from criteo-audiences
      //testAuthentication is
      //import from criteo-audiences
      //const response = await helper.getRequestHeaders() ??
      //expect(response.length).toBeGreaterThan(0)
      //expect(response).resolves.not.toThrowError()
    })

    it('should test that authentication fails', async () => {
      nock('https://api.criteo.com').post('/oauth2/token').reply(401)
      const response = expect(testDestination.testAuthentication(settings)) //import from criteo-audiences
      //import from criteo-audiences
      //const response = await helper.getRequestHeaders() ??
      //expect(response.message).toBe("Authentication failed") //this isn't in code
      //expect(response).rejects.toThrowError()
      response.resolves.not.toThrowError();
      response.toBe("Authentication failed");
    })
  })


  describe('getAudience', () => {
    it('should throw error if no access to advertiser account', async () => {
      const advertiserId = '12345'

      nock('https://api.criteo.com').get(`/2021-10/audiences?advertiser-id=${advertiserId}`).reply(403)
      //await expect(testDestination.testAction('getAudience')).rejects.toThrowError()
      const response = await getAdvertiserAudiences(
        request: RequestFn,
        advertiser_id: advertiserId,
        credentials: ClientCredentials
      )
      expect(response.status).toBe(!200)
      //expect error message or nothing to be returned
      //need to pass second argument as JSON in test action
    })

    it('should throw error if advertiser ID is not a number', async () => {
      const advertiserId = 'not an id'

      nock('https://api.criteo.com').get(`/2021-10/audiences?advertiser-id=${advertiserId}`).reply(400)
      //await expect(testDestination.testAction('getAudience')).rejects.toThrowError()
      const response = await getAdvertiserAudiences(
        request: RequestFn,
        advertiser_id: advertiserId,
        credentials: ClientCredentials
      )
      expect(response.message).toBe("The Advertiser ID should be a number")
      expect(response.status).toBe(400)
    })

    it('should work if valid id', async () => {
      const advertiserId = 'valid id'

      nock('https://api.criteo.com').get(`/2021-10/audiences?advertiser-id=${advertiserId}`).reply(200)

      //const response = await testDestination.testAction('getAudience')
      const response = await getAdvertiserAudiences(
        request,
        advertiserId,
        credentials
      )
      expect(response.length).toBeGreaterThanOrEqual(0)
      expect(response.status).toBe(200)
    })
  })

  describe('createAudience', () => {
    it('should throw error if no audience name given', async () => {
      nock('https://api.criteo.com')
        .post('/2022-01/audiences',
          {
            "data": {
              "type": "Audience",
              "attributes": {
                "advertiser_id": 'valid advertiser id'
              }
            }
          })
        .reply(400)

      //await expect(testDestination.testAction('createAudience')).rejects.toThrowError()
      await createAudience(
        request: RequestFn,
        advertiser_id: 'valid advertiser id',
        credentials: ClientCredentials
      )
      expect(response.message).toBe("Invalid Audience Name: ")
    })

    it('should throw error audience ID is not a number', async () => {
      nock('https://api.criteo.com')
        .post('/2022-01/audiences',
          {
            "data": {
              "type": "Audience",
              "attributes": {
                "name": "unique name for audience",
                "advertiser_id": 'abc123'
              }
            }
          })
        .reply(400)

      //await expect(testDestination.testAction('createAudience')).rejects.toThrowError()
      const response = createAudience(
        request: RequestFn,
        advertiser_id: 'abc123',
        credentials: ClientCredentials
      )

      expect(response.message).toBe("The Advertiser ID should be a number")
      expect(response.status).toBe(400)

    })

    it('should throw error if name is already being used', async () => {
      nock('https://api.criteo.com')
        .post('/2022-01/audiences',
          {
            "data": {
              "type": "Audience",
              "attributes": {
                "advertiser_id": 'valid id',
                "name": "name of audience already in use"
              }
            }
          })
        .reply(400)

      await expect(testDestination.testAction('createAudience')).rejects.toThrowError()
      //expect error message
      //NOT IN CODE
    })

    it('should work if payload is correct', async () => {
      nock('https://api.criteo.com')
        .post('/2022-01/audiences',
          {
            "data": {
              "type": "Audience",
              "attributes": {
                "advertiser_id": 'valid id',
                "name": "unique audience name"
              }
            }
          })
        .reply(200)

      //const response = await testDestination.testAction('createAudience')
      const response = await createAudience(
        request: RequestFn,
        advertiser_id: 'valid advertiser ID',
        credentials: ClientCredentials
      )
      expect(response.body.data.length).toBe(1)
      expect(response.status).toBe(200)
    })
  })

  describe('patchAudience', () => {
    it('should throw error if audience id is not a number', async () => {
      const audience_id = 'abc123'

      nock('https://api.criteo.com')
        .patch(`/2022-01/audiences/${audienceId}/contactlist`,
          {
            "data": {
              "type": "ContactlistAmendment",
              "attributes": {
                "operation": "add",
                "identifierType": "email",
                "identifiers": [
                  "example1@gmail.com"
                ]
              }
            }
          })
        .reply(400)

      //await expect(testDestination.testAction('patchAudience')).rejects.toThrowError()
      const response = await patchAudience(
        request: RequestFn,
        operation: {
        operation_type: string,
        audience_id: 'abc123',
        user_list: string[]
      },
        credentials: ClientCredentials
      )
      expect(response.message).toBe("The Audience ID should be a number")
    })

    it('should throw error if no operation type', async () => {
      const audience_id = 'valid audience id'

      nock('https://api.criteo.com')
        .patch(`/2022-01/audiences/${audienceId}/contactlist`,
          {
            "data": {
              "type": "ContactlistAmendment",
              "attributes": {
                "identifierType": "email",
                "identifiers": [
                  "example1@gmail.com"
                ]
              }
            }
          })
        .reply(400)

      //await expect(testDestination.testAction('patchAudience')).rejects.toThrowError()
      const response = await patchAudience(
        request: RequestFn,
        operation: {
        audience_id: string,
        user_list: string[]
      },
        credentials: ClientCredentials
      )
      expect(response.message).toBe("Incorrect operation type: ")
    })

    it('should throw error if wrong operation type', async () => {
      const audience_id = 'valid audience id'

      nock('https://api.criteo.com')
        .patch(`/2022-01/audiences/${audienceId}/contactlist`,
          {
            "data": {
              "type": "ContactlistAmendment",
              "attributes": {
                "operation_type": "wrong operation type",
                "identifierType": "email",
                "identifiers": [
                  "example1@gmail.com"
                ]
              }
            }
          })
        .reply(400)

      const response = await patchAudience(
        request: RequestFn,
        operation: {
        operation_type: 'wrong operation type',
        audience_id: string,
        user_list: string[]
      },
        credentials: ClientCredentials
      )
      expect(response.message).toBe("Incorrect operation type: wrong operation type")

      //await expect(testDestination.testAction('patchAudience')).rejects.toThrowError()
      //expect error message
    })

    it('should throw error if no identifiers', async () => {
      const audience_id = 'valid audience id'

      nock('https://api.criteo.com')
        .patch(`/2022-01/audiences/${audienceId}/contactlist`,
          {
            "data": {
              "type": "ContactlistAmendment",
              "attributes": {
                "operation_type": "add",
                "identifierType": "email"
              }
            }
          })
        .reply(400)

      await expect(testDestination.testAction('patchAudience')).rejects.toThrowError()
      //expect error message
      //NOT IN CODE
    })

    it('should work if payload and advertiser ID defined properly', async () => {
      const audience_id = 'valid audience id'

      nock('https://api.criteo.com')
        .patch(`/2022-01/audiences/${audienceId}/contactlist`,
          {
            "data": {
              "type": "ContactlistAmendment",
              "attributes": {
                "operation_type": "add",
                "identifierType": "email",
                "identifiers": [
                  "example1@gmail.com"
                ]
              }
            }
          })
        .reply(200)

      //const response = await testDestination.testAction('addUserToAudience')
      const response = await patchAudience(
        request: RequestFn,
        operation: {
        operation_type: string,
        audience_id: string,
        user_list: string[]
      },
        credentials: ClientCredentials
      )
      expect(response.length).toBeGreaterThanOrEqual(1)
      expect(response.status).toBe(200)
    })
  })
})

//test case for addUserToAudience action E2E:
const event = createTestEvent({
  "traits": {
    "email": "test.email@testing.org"
  },
  "event": "Audience Exited",
  "properties": {
    "audience_key": "weekly_active_shoppers_viewed_product_within_7_days",
  },
})

const responses = await testDestination.testAction('addUserToAudience', {
  event,
  settings,
  useDefaultMappings: true
})
expect(responses.length).toBe(1) //not sure what the decorated response contains
expect(responses[0].status).toBe(200)
