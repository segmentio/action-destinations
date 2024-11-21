import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Definition from '../../index'
import { API_URL } from '../../config'
import { AggregateAjvError } from '@segment/ajv-human-errors'
// import * as Functions from '../../functions'

const testDestination = createTestIntegration(Definition)

const apiKey = 'fake-api-key'

export const settings = {
  api_key: apiKey
}
const listId = 'XYZABC'

// const requestBody = {
//   data: [
//     {
//       type: 'profile',
//       id: 'XYZABC'
//     },
//     {
//       type: 'profile',
//       id: 'XYZABD'
//     }
//   ]
// }

describe('Remove List from Profile', () => {
  it('should throw error if no external_id/email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('removeProfileFromList', { event, settings })).rejects.toThrowError(
      AggregateAjvError
    )
  })

  it('should throw an error for invalid phone number format', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          phone: 'invalid-phone-number'
        }
      },
      properties: {}
    })

    const mapping = {
      list_id: listId,
      phone_number: {
        '@path': '$.context.traits.phone'
      }
    }

    await expect(
      testDestination.testAction('removeProfileFromList', { event, mapping, settings })
    ).rejects.toThrowError('invalid-phone-number is not a valid phone number and cannot be converted to E.164 format.')
  })

  it('should remove profile from list successfully with email address only', async () => {
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
      .get(`/?filter=any(email,["${email}"])`)
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', requestBody)
      .reply(200, {
        data: [
          {
            id: 'XYZABC'
          }
        ]
      })

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

  it('should remove profile from list successfully with External Id only', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    const external_id = 'testing_123'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(external_id,["${external_id}"])`)
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', requestBody)
      .reply(200, {
        data: [
          {
            id: 'XYZABC'
          }
        ]
      })

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      context: {
        personas: {
          external_audience_id: listId
        }
      },
      properties: {
        external_id: 'testing_123'
      }
    })
    const mapping = {
      list_id: listId,
      external_id: 'testing_123'
    }

    await expect(
      testDestination.testAction('removeProfileFromList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('should remove profile from list successfully with Phone Number only', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    const phone_number = '+15005435907'
    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(phone_number,["${phone_number}"])`)
      .reply(200, {
        data: [{ id: 'XYZABC' }]
      })

    nock(`${API_URL}/lists/${listId}`)
      .delete('/relationships/profiles/', requestBody)
      .reply(200, {
        data: [
          {
            id: 'XYZABC'
          }
        ]
      })

    const event = createTestEvent({
      type: 'track',
      userId: '123',
      context: {
        personas: {
          external_audience_id: listId
        }
      },
      properties: {
        phone_number: '+15005435907'
      }
    })
    const mapping = {
      list_id: listId,
      phone_number: '+15005435907'
    }

    await expect(
      testDestination.testAction('removeProfileFromList', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })
})
