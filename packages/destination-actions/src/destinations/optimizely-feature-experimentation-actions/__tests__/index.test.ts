import nock from 'nock'
import { createTestIntegration, createTestEvent } from '@segment/actions-core'
import { DecoratedResponse } from '@segment/actions-core'
import Definition from '../index'

const testDestination = createTestIntegration(Definition)

describe('Optimizely Feature Experimentation (actions)', () => {
  describe('testAuthentication', () => {
    it('should validate dataFile URL', async () => {
      const settings = {
        accountId: '12345566',
        dataFileUrl: 'https://cdn.example.com/dataFile.json'
      }
      nock(settings.dataFileUrl).get('').reply(200)
      await expect(testDestination.testAuthentication(settings)).resolves.not.toThrowError()
    })
  })

  describe('delete', () => {
    it('should send delete requests', async () => {
      nock('https://api.optimizely.com/v2/subject-access-requests', {}).post('').reply(200, {})

      const event = createTestEvent({
        type: 'delete',
        userId: 'sloth@segment.com',
        traits: {
          data_type: 'visitor',
          identifier: 12345566,
          identifier_type: 'dcp_id',
          request_type: 'delete'
        }
      })

      if (testDestination.onDelete) {
        const response = await testDestination.onDelete(event, {
          accountId: '12345566',
          dataFileUrl: 'https://cdn.example.com/dataFile.json',
          accessToken: '2:p4Ln3WyypkfZKCd7ScfY1Py-KoZgLbkEoC2LJsQOwTWdrPq460'
        })

        const resp = response as DecoratedResponse
        expect(resp.status).toBe(200)
        expect(resp.data).toMatchObject({})
      }
    })

    it('should throw error if access token not provided in settings and getting delete request', async () => {
      nock('https://api.optimizely.com/v2/subject-access-requests', {}).post('').reply(400, {})

      const event = createTestEvent({
        type: 'delete',
        userId: 'sloth@segment.com',
        traits: {
          data_type: 'visitor',
          identifier: 12345566,
          identifier_type: 'dcp_id',
          request_type: 'delete'
        }
      })

      if (testDestination.onDelete) {
        await expect(
          testDestination.onDelete(event, {
            accountId: '12345566',
            dataFileUrl: 'https://cdn.example.com/dataFile.json'
          })
        ).rejects.toThrowError(`Access Token is required for user deletion`)
      }
    })
  })
})
