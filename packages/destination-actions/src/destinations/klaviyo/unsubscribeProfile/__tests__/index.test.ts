import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { PayloadValidationError } from '@segment/actions-core'
import nock from 'nock'
const testDestination = createTestIntegration(Destination)

const apiKey = 'fake-api-key'
export const settings = {
  api_key: apiKey
}

describe('Unsubscribe Profile', () => {
  it('should throw error if no email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, settings, useDefaultMappings: true })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('formats the correct request body when list id is empty', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '+17067675219',
      list_id: '',
      timestamp: '2024-04-01T18:37:06.558Z'
    }
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email,
                  phone_number: payload.phone_number
                }
              }
            ]
          }
        }
      }
    }
    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-delete-jobs', requestBody).reply(200, {})
    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      }
    })
    const mapping = {
      list_id: payload.list_id,
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })

  it('formats the correct request body when list id is populated', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '+17067675219',
      list_id: '1234',
      timestamp: '2024-04-01T18:37:06.558Z'
    }
    const requestBody = {
      data: {
        type: 'profile-subscription-bulk-delete-job',
        attributes: {
          profiles: {
            data: [
              {
                type: 'profile',
                attributes: {
                  email: payload.email,
                  phone_number: payload.phone_number
                }
              }
            ]
          }
        },
        relationships: {
          list: {
            data: {
              type: 'list',
              id: payload.list_id
            }
          }
        }
      }
    }
    nock('https://a.klaviyo.com/api').post('/profile-subscription-bulk-delete-jobs', requestBody).reply(200, {})
    const event = createTestEvent({
      type: 'track',
      timestamp: payload.timestamp,
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      }
    })
    const mapping = {
      list_id: payload.list_id,
      consented_at: {
        '@path': '$.timestamp'
      },
      email: {
        '@path': '$.context.traits.email'
      },
      phone_number: {
        '@path': '$.context.traits.phone_number'
      }
    }
    await expect(
      testDestination.testAction('unsubscribeProfile', { event, mapping, settings })
    ).resolves.not.toThrowError()
  })
})
