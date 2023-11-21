import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}
const listId = 'XYZABC'

describe('Remove List from Profile', () => {
  it('should throw error if no external_id/email is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('removeProfileFromList', { event, settings })).rejects.toThrowError(
      AggregateAjvError
    )
  })

  it('should remove profile from list if successful', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    const email = 'test@example.com'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=equals(email,"${email}")`)
      .reply(
        200,
        JSON.stringify({
          content: {
            data: [{ id: 'XYZABC' }]
          }
        })
      )

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', requestBody)
      .reply(
        200,
        JSON.stringify({
          content: {
            data: [
              {
                id: 'XYZABC'
              }
            ]
          }
        })
      )

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      context: {
        personas: {
          external_audience_id: listId
        },
        traits: {
          email: 'test@example.com'
        }
      }
    })

    await expect(
      testDestination.testAction('removeProfileFromList', { event, settings, useDefaultMappings: true })
    ).resolves.not.toThrowError()
  })
})
