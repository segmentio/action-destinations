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

describe('Remove Profile', () => {
  it('should throw error if no external_id/email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track',
      properties: {}
    })

    await expect(testDestination.testAction('removeProfile', { event, settings })).rejects.toThrowError(
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
      },
      country_code: 'IN'
    }

    await expect(testDestination.testAction('removeProfile', { event, mapping, settings })).rejects.toThrowError(
      'invalid-phone-number is not a valid phone number and cannot be converted to E.164 format.'
    )
  })

  it('should convert a phone number to E.164 format if country code is provided', async () => {
    const requestBody = {
      data: [
        {
          type: 'profile',
          id: 'XYZABC'
        }
      ]
    }

    nock(`${API_URL}/profiles`)
      .get(`/?filter=any(phone_number,["+918448309222"])`)
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
        phone_number: '8448309222'
      }
    })
    const mapping = {
      list_id: listId,
      phone_number: '8448309222',
      country_code: 'IN'
    }

    await expect(testDestination.testAction('removeProfile', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should remove profile from list successfully with email address only', async () => {
    const mapping = { list_id: listId, email: 'test@example.com' }
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
      testDestination.testAction('removeProfile', { event, settings, mapping, useDefaultMappings: true })
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

    await expect(testDestination.testAction('removeProfile', { event, mapping, settings })).resolves.not.toThrowError()
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

    await expect(testDestination.testAction('removeProfile', { event, mapping, settings })).resolves.not.toThrowError()
  })

  it('should throw payload validation error when no profile is mapped with provided identifier', async () => {
    const phone_number = '+15005435907'
    nock(`${API_URL}/profiles`).get(`/?filter=any(phone_number,["${phone_number}"])`).reply(200, {
      data: []
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

    await expect(testDestination.testAction('removeProfile', { event, mapping, settings })).rejects.toThrowError(
      'No profiles found for the provided identifiers.'
    )
  })
})
