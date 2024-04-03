// import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'
import { PayloadValidationError } from '@segment/actions-core'
import nock from 'nock'
import { SubscribeEventData } from '../../types'
const testDestination = createTestIntegration(Destination)

const apiKey = 'fake-api-key'
export const settings = {
  api_key: apiKey
}

describe('Subscribe Profile', () => {
  it('should throw error if no email or phone_number is provided', async () => {
    const event = createTestEvent({
      type: 'track'
    })

    await expect(
      testDestination.testAction('subscribeProfile', { event, settings, useDefaultMappings: true })
    ).rejects.toThrowError(PayloadValidationError)
  })

  it('should throw error if both subscribe_email and subscribe_sms are false', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'segment@test.com',
          phone_number: '+17065802344'
        }
      }
    })
    const mapping = {
      klaviyo_id: '12345',
      subscribe_email: false,
      subscribe_sms: false,
      list_id: 'WB2LME',
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

    await expect(testDestination.testAction('subscribeProfile', { event, settings, mapping })).rejects.toThrowError(
      PayloadValidationError
    )
  })

  it('Format the correct request body when list id is empty', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'jd@email.com',
          phone_number: '+17067675219'
        }
      },
      timestamp: '2024-04-01T18:37:06.558Z'
    })
    const mapping = {
      klaviyo_id: '',
      subscribe_email: true,
      subscribe_sms: true,
      list_id: '',
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
    const expectedRequestBody = generateExpectedRequestBody()

    const scope = nock('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/')

    // Intercept POST requests and ensure the request bodies match after mappings
    scope
      .post('/', (body) => {
        // Check if the request body matches the expectedRequestBody
        return JSON.stringify(body) === JSON.stringify(expectedRequestBody)
      })
      .reply(200, 'Request body matches')

    // makes the mocked post request
    await testDestination.testAction('subscribeProfile', { event, settings, mapping })

    // Use Jest's expect to assert that the request was made with the expected body
    expect(scope.isDone()).toBe(true)
  })

  it('Format the correct request body when list id is populated', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'jd@email.com',
          phone_number: '+17067675219'
        }
      },
      timestamp: '2024-04-01T18:37:06.558Z'
    })
    const mapping = {
      klaviyo_id: '',
      subscribe_email: true,
      subscribe_sms: true,
      list_id: '12345',
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
    const expectedRequestBody = generateExpectedRequestBody('12345')

    const scope = nock('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/')

    // Intercept POST requests and ensure the request bodies match after mappings
    scope
      .post('/', (body) => {
        // Check if the request body matches the expectedRequestBody
        return JSON.stringify(body) === JSON.stringify(expectedRequestBody)
      })
      .reply(200, 'Request body matches')

    // makes the mocked post request
    await testDestination.testAction('subscribeProfile', { event, settings, mapping })

    // Use Jest's expect to assert that the request was made with the expected body
    expect(scope.isDone()).toBe(true)
  })
})

function generateExpectedRequestBody(listId = '') {
  const requestBody: SubscribeEventData = {
    data: {
      type: 'profile-subscription-bulk-create-job',
      attributes: {
        custom_source: 'Segment Klaviyo (Actions) Destination',
        profiles: {
          data: [
            {
              type: 'profile',
              attributes: {
                email: 'jd@email.com',
                phone_number: '+17067675219',
                subscriptions: {
                  email: {
                    marketing: {
                      consent: 'SUBSCRIBED',
                      consented_at: '2024-04-01T18:37:06.558Z'
                    }
                  },
                  sms: {
                    marketing: {
                      consent: 'SUBSCRIBED',
                      consented_at: '2024-04-01T18:37:06.558Z'
                    }
                  }
                }
              }
            }
          ]
        }
      }
    }
  }

  if (listId !== '') {
    requestBody.data.relationships = {
      list: {
        data: {
          type: 'list',
          id: listId
        }
      }
    }
  }

  return requestBody
}
