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
  it('should throw error if no list_id is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('addProfileToList', { event, settings })).rejects.toThrowError(
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

    nock(`${API_URL}/lists/${listId}`).delete('/relationships/profiles/', requestBody).reply(200, {})

    const event = createTestEvent({
      type: 'track',
      userId: '123'
    })
    const mapping = {
      list_id: listId,
      profile_id: 'demo-profile-id'
    }

    await expect(
      testDestination.testAction('removeProfileToList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })
})
