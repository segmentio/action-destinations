import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}
const listId = 'demo-list-id'

describe('Add List To Profile', () => {
  it('should throw error if no list_id/email is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('addProfileToList', { event, settings })).rejects.toThrowError(
      IntegrationError
    )
  })

  it('should add profile to list if successful', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'demo-profile-id'
        }
      ]
    }

    const profileData = {
      data: {
        type: 'profile',
        attributes: {
          email: 'demo@segment.com'
        }
      }
    }

    nock(`${API_URL}`).post('/profiles/', profileData).reply(200, {})

    nock(`${API_URL}/lists/${listId}`)
      .post('/relationships/profiles/', requestBody)
      .reply(
        200,
        JSON.stringify({
          content: requestBody
        })
      )

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      traits: {
        email: 'demo@segment.com'
      }
    })
    const mapping = {
      external_id: listId,
      email: {
        '@path': '$.traits.email'
      }
    }
    await expect(
      testDestination.testAction('addProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })
})
