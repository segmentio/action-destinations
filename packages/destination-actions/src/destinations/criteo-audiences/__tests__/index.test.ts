import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'
import { patchAudience, getAdvertiserAudiences, getAudienceId, createAudience } from '../criteo-audiences'
import type { RequestFn, ClientCredentials, Operation } from '../criteo-audiences'
const testDestination = createTestIntegration(Definition)

//valid destination fields

const VALID_ADVERTISER_ID = '1234'
const INVALID_ADVERTISER_ID = 'abcd'
const AUDIENCE_KEY = "weekly_active_shoppers_viewed_product_within_7_days"

const event = createTestEvent({
  "context": {
    "traits": {
      "email": "test.email@testing.org"
    }
  },
  "event": "Audience Entered",
  "properties": {
    "audience_key": AUDIENCE_KEY,
  }
})

const VALID_CREDENTIALS = {
  client_id: 'valid test_id',
  client_secret: 'valid test_secret',
}

const VALID_SETTINGS = {
  client_id: VALID_CREDENTIALS.client_id,
  client_secret: VALID_CREDENTIALS.client_secret,
  advertiser_id: VALID_ADVERTISER_ID
}

const ADVERTISER_AUDIENCES = {
  "data": [
    {
      "id": "1234",
      "attributes": {
        "advertiserId": VALID_ADVERTISER_ID,
        "name": AUDIENCE_KEY
      }
    }
  ]
}

const AUDIENCE_CREATION_RESPONSE = {
  "data": {
    "id": "5678",
    "type": "Audience"
  },
  "errors": [],
  "warnings": []
}


describe('Criteo-Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate valid auth token', async () => {
      nock('https://api.criteo.com').post('/oauth2/token').reply(200);
      let settings = VALID_SETTINGS;
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })

    it('should test that authentication fails', async () => {
      nock('https://api.criteo.com').post('/oauth2/token').reply(401)
      let settings = VALID_SETTINGS;
      await expect(testDestination.testAuthentication(settings)).rejects.toThrowError("")
    })
  })

  describe('addUserToAudience', () => {
    it('should throw error if no access to the audiences of the advertiser', async () => {
      let settings = VALID_SETTINGS;
      nock('https://api.criteo.com').post('/oauth2/token').reply(200)
      nock('https://api.criteo.com').get(/^\/\d{4}-\d{2}\/audiences$)/).query({ "advertiser-id": settings.advertiser_id }).reply(403)
      await expect(
        testDestination.testAction('addUserToAudience', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should throw error if advertiser ID is not a number', async () => {
      nock('https://api.criteo.com').post('/oauth2/token').reply(200)

      let settings = {
        client_id: VALID_CREDENTIALS.client_id,
        client_secret: VALID_CREDENTIALS.client_secret,
        advertiser_id: INVALID_ADVERTISER_ID
      }

      const response = await expect(
        testDestination.testAction('addUserToAudience', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should throw error if failing to create a new audience', async () => {
      let settings = VALID_SETTINGS;
      nock('https://api.criteo.com').post('/oauth2/token').reply(200)
      nock('https://api.criteo.com').get(/^\/\d{4}-\d{2}\/audiences$)/).query({ "advertiser-id": settings.advertiser_id }).reply(200, {
        "data": [
          {
            "id": "1234",
            "attributes": {
              "advertiserId": VALID_ADVERTISER_ID,
              "name": AUDIENCE_KEY
            }
          }
        ]
      }
      )
      // The audience key is not present in the list of the advertiser's audiences so a new audience needs to be created
      nock('https://api.criteo.com').post("/audiences").reply(403)

      const response = await expect(
        testDestination.testAction('addUserToAudience', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).rejects.toThrowError()
    })

    it('should not throw an error if the audience creation and the patch requests succeed', async () => {
      let settings = VALID_SETTINGS;
      nock('https://api.criteo.com').post('/oauth2/token').reply(200)
      nock('https://api.criteo.com').get(/^\/\d{4}-\d{2}\/audiences$)/).query({ "advertiser-id": settings.advertiser_id }).reply(200, {
        "data": [
          {
            "id": "1234",
            "attributes": {
              "advertiserId": VALID_ADVERTISER_ID,
              "name": AUDIENCE_KEY
            }
          }
        ]
      }
      )
      // The audience key is not present in the list of the advertiser's audiences so a new audience needs to be created
      nock('https://api.criteo.com').post("/audiences").reply(200, AUDIENCE_CREATION_RESPONSE)
      nock('https://api.criteo.com').patch(`/audiences/${AUDIENCE_CREATION_RESPONSE.data.id}/contactlist`).reply(200)

      const response = await expect(
        testDestination.testAction('addUserToAudience', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
    })

    it('should not throw an error if no new audience is created and the patch requests succeed', async () => {
      let settings = VALID_SETTINGS;
      nock('https://api.criteo.com').post('/oauth2/token').reply(200)
      nock('https://api.criteo.com').get(/^\/\d{4}-\d{2}\/audiences$)/).query({ "advertiser-id": settings.advertiser_id }).reply(200, ADVERTISER_AUDIENCES)
      nock('https://api.criteo.com').patch(`/audiences/${ADVERTISER_AUDIENCES.data[0].id}/contactlist`).reply(200)

      const response = await expect(
        testDestination.testAction('addUserToAudience', {
          event,
          settings,
          useDefaultMappings: true
        })
      ).resolves.not.toThrowError()
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


const responses = await testDestination.testAction('addUserToAudience', {
  event,
  settings,
  useDefaultMappings: true
})
expect(responses.length).toBe(1) //not sure what the decorated response contains
expect(responses[0].status).toBe(200)
