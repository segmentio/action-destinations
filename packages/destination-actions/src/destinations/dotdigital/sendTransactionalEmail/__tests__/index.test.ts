import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Send transactional email', () => {
  it('should send transactional email', async () => {
    // Mock send transactional email
    nock(settings.api_host).post(`/v2/email`).reply(200)

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'toaddress@example.com'
        }
      }
    })

    const mapping = {
      fromAddress: 'fromaddress@example.com',
      subject: 'The email subject line.',
      toAddresses: {
        '@path': '$.context.traits.email'
      },
      htmlContent: '<h1>HTML content email</h1>',
      plainTextContent: 'Plain text content email'
    }

    await expect(
      testDestination.testAction('sendTransactionalEmail', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })
})
