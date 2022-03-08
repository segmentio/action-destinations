import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Criteo-Audiences', () => {
  describe('testAuthentication', () => {
    it('should validate valid auth token', async () => {
      nock('https://api.criteo.com').post('/oauth2/token').reply(200)

      const authData = {
        client_id: 'valid test_id',
        client_secret: 'valid test_secret',
        advertiser_id: '12345'
      }

      await expect(testDestination.testAuthentication(authData)).resolves.not.toThrowError()
    })

    it('should test that authentication fails', async () => {
      nock('https://api.criteo.com').post('/oauth2/token').reply(401)

      const authData = {
        client_id: 'invalid test_id',
        client_secret: 'invalid test_secret',
        advertiser_id: '12345'
      }

      await expect(testDestination.testAuthentication(authData)).rejects.toThrowError()
    })
  })


  describe('getAudience', () => {
    it('should throw error if no access to advertiser account', async () => {
      const advertiserId = '12345'

      nock('https://api.criteo.com').get(`/2021-10/audiences?advertiser-id=${advertiserId}`).reply(403)
      await expect(testDestination.testAction('getAudience')).rejects.toThrowError()
    })

    it('should throw error if advertiser ID is not a number', async () => {
      const advertiserId = 'not an id'

      nock('https://api.criteo.com').get(`/2021-10/audiences?advertiser-id=${advertiserId}`).reply(400)
      await expect(testDestination.testAction('getAudience')).rejects.toThrowError()
    })

    it('should work if valid id', async () => {
      const advertiserId = 'valid id'

      nock('https://api.criteo.com').get(`/2021-10/audiences?advertiser-id=${advertiserId}`).reply(200)

      const response = await testDestination.testAction('getAudience')

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

      await expect(testDestination.testAction('createAudience')).rejects.toThrowError()
    })

    it('should throw error if no audience id is given', async () => {
      nock('https://api.criteo.com')
        .post('/2022-01/audiences',
          {
            "data": {
              "type": "Audience",
              "attributes": {
                "name": "unique name for audience"
              }
            }
          })
        .reply(400)

      await expect(testDestination.testAction('createAudience')).rejects.toThrowError()
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

      const response = await testDestination.testAction('createAudience')

      expect(response.status).toBe(200)
    })
  })

  describe('patchAudience', () => {
    it('should throw error if audience id is invalid', async () => {
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

      await expect(testDestination.testAction('patchAudience')).rejects.toThrowError()
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

      await expect(testDestination.testAction('patchAudience')).rejects.toThrowError()
    })

    it('should throw error if incorrect operation type', async () => {
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

      await expect(testDestination.testAction('patchAudience')).rejects.toThrowError()
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

      const response = await testDestination.testAction('patchAudience')

      expect(response.status).toBe(200)
    })
  })
})
