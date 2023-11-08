import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}
const listId = 'XAXAXA'

describe('Remove List from Profile', () => {
  it('should throw error if no list_id/email is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('removeProfileToList', { event, settings })).rejects.toThrowError(
      IntegrationError
    )
  })

  it('should remove profile from list if successful', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'demo-profile-id'
        }
      ]
    }

    const email = 'test@example.com'
    nock(`${API_URL}/profiles`).get(`/?filter=equals(email,"${email}")`).reply(200, {})

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', requestBody)
      .reply(
        200,
        JSON.stringify({
          content: {
            data: [
              {
                id: 'demo-profile-id'
              }
            ]
          }
        })
      )

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      traits: {
        email: 'test@example.com'
      },
      context: {
        personas: {
          external_id: listId
        }
      }
    })

    await expect(
      testDestination.testAction('removeProfileToList', { event, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })
})
