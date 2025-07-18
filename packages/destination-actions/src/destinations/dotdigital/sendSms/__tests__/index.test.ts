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
    nock(settings.api_host).post(`/v2/sms-messages/send-to/${mobileNumber}`).reply(204, {})

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

  describe('Message body validation', () => {
    it('should handle standard SMS length (160 characters)', async () => {
      const mobileNumber = '441234567890'
      const longMessage = 'A'.repeat(160) // Exactly 160 characters

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${mobileNumber}`).reply(204, {})

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: longMessage,
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

    it('should handle very long message body (over 160 characters)', async () => {
      const mobileNumber = '441234567890'
      const veryLongMessage = 'A'.repeat(500) // Much longer than standard SMS

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${mobileNumber}`).reply(400, {
        message: 'Message too long',
        errorCode: 'INVALID_MESSAGE_LENGTH'
      })

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: veryLongMessage,
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
      ).rejects.toThrow()
    })

    it('should handle empty message body', async () => {
      const mobileNumber = '441234567890'

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: '',
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
      ).rejects.toThrow()
    })

    it('should handle Unicode characters in message', async () => {
      const mobileNumber = '441234567890'
      const unicodeMessage = 'Hello 🌟 émojis and spëcial chars' // 33 characters with Unicode

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${mobileNumber}`).reply(204, {})

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: unicodeMessage,
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

  describe('Phone number validation', () => {
    it('should handle valid E.164 format with plus sign', async () => {
      const mobileNumber = '+441234567890'
      const cleanedNumber = '441234567890' // After cleaning by helper function

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${cleanedNumber}`).reply(204, {})

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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

    it('should handle phone number with spaces and dashes', async () => {
      const mobileNumber = '+44 123-4567890' // Single space and single dash
      const cleanedNumber = '441234567890' // After cleaning by helper function

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${cleanedNumber}`).reply(204, {})

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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

    it('should handle phone number cleaning limitations', async () => {
      // The helper function now removes ALL non-numeric characters
      const mobileNumber = '+44 123-456-7890'
      const cleanedNumber = '441234567890' // All non-numeric characters are removed

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${cleanedNumber}`).reply(204, {})

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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

    it('should reject invalid phone number - too short', async () => {
      const invalidNumber = '123'

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${invalidNumber}`).reply(400, {
        message: 'Invalid phone number format',
        errorCode: 'INVALID_PHONE_NUMBER'
      })

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: invalidNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })

    it('should reject invalid phone number - contains letters', async () => {
      const invalidNumber = '44123abc7890'

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${invalidNumber}`).reply(400, {
        message: 'Invalid phone number format',
        errorCode: 'INVALID_PHONE_NUMBER'
      })

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: invalidNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })

    it('should reject invalid phone number - too long', async () => {
      const invalidNumber = '441234567890123456789' // Much too long

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${invalidNumber}`).reply(400, {
        message: 'Invalid phone number format',
        errorCode: 'INVALID_PHONE_NUMBER'
      })

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: invalidNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })

    it('should reject empty phone number', async () => {
      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: ''
          }
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })

    it('should reject phone number with only special characters', async () => {
      const invalidNumber = '++--  ()'

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: invalidNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })
  })

  describe('Edge cases', () => {
    it('should handle missing phone number in payload', async () => {
      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {}
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })

    it('should handle API rate limiting error', async () => {
      const mobileNumber = '441234567890'

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${mobileNumber}`).reply(429, {
        message: 'Rate limit exceeded',
        errorCode: 'RATE_LIMIT_EXCEEDED'
      })

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })

    it('should handle authentication error', async () => {
      const mobileNumber = '441234567890'

      nock(settings.api_host).post(`/v2/sms-messages/send-to/${mobileNumber}`).reply(401, {
        message: 'Unauthorized',
        errorCode: 'AUTHENTICATION_FAILED'
      })

      const event = createTestEvent({
        type: 'track',
        context: {
          traits: {
            phone: mobileNumber
          }
        }
      })

      const mapping = {
        message: 'Test message',
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
      ).rejects.toThrow()
    })
  })
})
