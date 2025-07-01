import nock from 'nock'
import { createTestEvent, createTestIntegration, APIError } from '@segment/actions-core'
import Braze from '../../index'

const testDestination = createTestIntegration(Braze)

const settings = {
  app_id: 'my-app-id',
  api_key: 'my-api-key',
  endpoint: 'https://rest.iad-01.braze.com'
}

describe('Braze IdentifyUser2', () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe('Error Handling', () => {
    it('should handle 2xx responses with errors array (try block)', async () => {
      // Mock a successful status but with errors in response body
      const mockResponse = {
        aliases_processed: 0,
        emails_processed: 0,
        phone_numbers_processed: 0,
        message: 'success',
        errors: [
          {
            type: "Request can not contain both of 'most_recently_updated' and 'least_recently_updated' values in the 'prioritization' array",
            input_array: 'user_identifiers',
            index: 0
          }
        ]
      }

      nock(settings.endpoint).post('/users/identify').reply(200, mockResponse)

      const event = createTestEvent({
        type: 'identify',
        userId: 'test-user-123'
      })

      try {
        await testDestination.testAction('identifyUser2', {
          event,
          settings,
          mapping: {
            external_id: 'test-user-123',
            email_to_identify: 'test@example.com',
            prioritization: {
              first_priority: 'most_recently_updated',
              second_priority: 'least_recently_updated'
            },
            __segment_internal_sync_mode: 'add'
          }
        })
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect(error.message).toBe(
          "Request can not contain both of 'most_recently_updated' and 'least_recently_updated' values in the 'prioritization' array"
        )
        expect(error.status).toBe(400)
      }
    })

    it('should handle 4xx responses with message field (catch block)', async () => {
      // Mock a 400 status with message in response body
      const mockResponse = {
        message: 'Invalid request - Mock Error'
      }

      nock(settings.endpoint).post('/users/identify').reply(400, mockResponse)

      const event = createTestEvent({
        type: 'identify',
        userId: 'test-user-123'
      })

      try {
        await testDestination.testAction('identifyUser2', {
          event,
          settings,
          mapping: {
            external_id: 'test-user-123',
            email_to_identify: 'test@example.com',
            prioritization: {
              first_priority: 'most_recently_updated'
            },
            __segment_internal_sync_mode: 'add'
          }
        })
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(APIError)
        expect(error.message).toBe('Invalid request - Mock Error')
        expect(error.status).toBe(400)
      }
    })

    it('should succeed when no errors are present in 2xx response', async () => {
      // Mock a successful response without errors
      const mockResponse = {
        aliases_processed: 1,
        emails_processed: 1,
        phone_numbers_processed: 0,
        message: 'success'
      }

      nock(settings.endpoint).post('/users/identify').reply(200, mockResponse)

      const event = createTestEvent({
        type: 'identify',
        userId: 'test-user-123'
      })

      const responses = await testDestination.testAction('identifyUser2', {
        event,
        settings,
        mapping: {
          external_id: 'test-user-123',
          email_to_identify: 'test@example.com',
          prioritization: {
            first_priority: 'most_recently_updated'
          },
          __segment_internal_sync_mode: 'add'
        }
      })
      expect(responses).toBeDefined()
      expect(responses.length).toBeGreaterThanOrEqual(1)
      // Check the last response in the array (current test's response)
      const currentResponse = responses[responses.length - 1]
      expect(currentResponse.status).toBe(200)
      expect(currentResponse.data).toEqual(mockResponse)
    }),
      it('fails when email_to_identify is provided without prioritization field', async () => {
        // Email without prioritization should fail validation
        const event = createTestEvent({
          type: 'identify',
          userId: 'test-user-5'
        })

        await expect(
          testDestination.testAction('identifyUser2', {
            event,
            settings,
            mapping: {
              external_id: 'test-user-5',
              email_to_identify: 'test5@example.com',
              __segment_internal_sync_mode: 'add'
            }
          })
        ).rejects.toThrow()
      })

    it('fails when neither user_alias nor email_to_identify is provided', async () => {
      // Neither user_alias nor email_to_identify provided
      const event = createTestEvent({
        type: 'identify',
        userId: 'test-user-6'
      })

      await expect(
        testDestination.testAction('identifyUser2', {
          event,
          settings,
          mapping: {
            external_id: 'test-user-6',
            merge_behavior: 'none',
            __segment_internal_sync_mode: 'add'
          }
        })
      ).rejects.toThrow()
    })
  })
})
