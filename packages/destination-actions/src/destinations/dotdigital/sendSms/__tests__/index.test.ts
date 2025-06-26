import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Send sms', () => {
  it('should send sms', async () => {
    const mobileNumber = '441234567890'
    // Mock API calls for enrolling contact
    nock(settings.api_host)
      .post(`/v2/sms-messages/send-to/${mobileNumber}`)
      .reply(204, {  })

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          phone: mobileNumber
        }
      }
    })

    const mapping = {
      message: 'Message body to send',
      to: {
        '@path': '$.context.traits.phone'
      }
    }

    await expect(
      testDestination.testAction('sendSms', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })
})
