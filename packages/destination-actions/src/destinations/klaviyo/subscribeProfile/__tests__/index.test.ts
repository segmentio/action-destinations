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
    // subscribe_email: false, subscribe_sms: false,
    const mapping = generateMapping(false, false, '', '')

    await expect(testDestination.testAction('subscribeProfile', { event, settings, mapping })).rejects.toThrowError(
      PayloadValidationError
    )
  })

  it('should throw error if (email = "", email_subscribed = true; phone = "+17065802344", subscribe_sms = false)', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: '',
          phone_number: '+17065802344'
        }
      }
    })
    // subscribe_email: true, subscribe_sms: false,
    const mapping = generateMapping(true, false, '', '')

    await expect(testDestination.testAction('subscribeProfile', { event, settings, mapping })).rejects.toThrowError(
      PayloadValidationError
    )
  })

  it('should throw error if (email = "valid@email.com", email_subscribed = false; phone = "", subscribe_sms = true)', async () => {
    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'valid@email.com',
          phone_number: ''
        }
      }
    })
    // subscribe_email: false, subscribe_sms: true,
    const mapping = generateMapping(false, true, '', '')
    await expect(testDestination.testAction('subscribeProfile', { event, settings, mapping })).rejects.toThrowError(
      PayloadValidationError
    )
  })

  it('Formats the correct request body when list id is empty', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '+17067675219',
      subscribe_email: true,
      subscribe_sms: true,
      list_id: '',
      klaviyo_id: ''
    }

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      },
      timestamp: '2024-04-01T18:37:06.558Z'
    })
    const mapping = generateMapping(payload.subscribe_email, payload.subscribe_sms, payload.list_id, payload.klaviyo_id)
    const expectedRequestBody = generateExpectedRequestBody(
      payload.list_id,
      payload.klaviyo_id,
      payload.email,
      payload.phone_number
    )

    const scope = nock('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/')

    // Intercept POST requests and ensure the request bodies match after mappings
    scope
      .post('/', (body) => {
        return JSON.stringify(body) === JSON.stringify(expectedRequestBody)
      })
      .reply(200, 'Request body matches')

    await expect(
      testDestination.testAction('subscribeProfile', { event, settings, mapping })
    ).resolves.not.toThrowError()
  })

  it('Formats the correct request body when list id is populated', async () => {
    const payload = {
      email: 'segment@email.com',
      phone_number: '+17067675219',
      subscribe_email: true,
      subscribe_sms: true,
      list_id: '12345',
      klaviyo_id: ''
    }

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: payload.email,
          phone_number: payload.phone_number
        }
      },
      timestamp: '2024-04-01T18:37:06.558Z'
    })
    const mapping = generateMapping(payload.subscribe_email, payload.subscribe_sms, payload.list_id, payload.klaviyo_id)
    const expectedRequestBody = generateExpectedRequestBody(
      payload.list_id,
      payload.klaviyo_id,
      payload.email,
      payload.phone_number
    )

    const scope = nock('https://a.klaviyo.com/api/profile-subscription-bulk-create-jobs/')

    // Intercept POST requests and ensure the request bodies match after mappings
    scope
      .post('/', (body) => {
        return JSON.stringify(body) === JSON.stringify(expectedRequestBody)
      })
      .reply(200, 'Request body matches')

    await expect(
      testDestination.testAction('subscribeProfile', { event, settings, mapping })
    ).resolves.not.toThrowError()
  })
})

function generateMapping(subscribe_email: boolean, subscribe_sms: boolean, list_id: string, klaviyo_id: string) {
  const mapping = {
    klaviyo_id,
    subscribe_email,
    subscribe_sms,
    list_id,
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
  return mapping
}

function generateExpectedRequestBody(list_id: string, klaviyo_id: string, email: string, phone_number: string) {
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
                email,
                phone_number,
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

  if (klaviyo_id !== '') {
    requestBody.data.attributes.profiles.data[0].attributes.id = klaviyo_id
  }

  if (list_id !== '') {
    requestBody.data.relationships = {
      list: {
        data: {
          type: 'list',
          id: list_id
        }
      }
    }
  }

  return requestBody
}
