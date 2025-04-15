import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Enroll Contact to Program', () => {
  it('should enroll contact to a program with email identifier', async () => {
    // Mock API calls for enrolling contact
    nock(settings.api_host)
      .patch('/contacts/v3/email/test@example.com')
      .reply(200, { contactId: '123' })

    nock(settings.api_host)
      .post('/v2/programs/enrolments', { contacts: ['123'], programId: '456' }) // Updated body
      .reply(201, { success: true }) // Add a valid JSON response

    const event = createTestEvent({
      type: 'identify',
      context: {
        traits: {
          email: 'test@example.com'
        }
      }
    })

    const mapping = {
      programId: 456,
      channelIdentifier: 'email',
      emailIdentifier: {
        '@path': '$.context.traits.email'
      }
    }

    await expect(
      testDestination.testAction('enrolContact', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })

  it('should enroll contact to a program with mobile number identifier', async () => {
    // Mock API calls for enrolling contact
    nock(settings.api_host)
      .get('/contacts/v3/mobile-number/1234567890')
      .reply(200, { contactId: '123' })

    nock(settings.api_host)
      .post('/v2/programs/enrolments', { contacts: ['123'], programId: '456' }) // Updated body
      .reply(201, { success: true }) // Add a valid JSON response

    const event = createTestEvent({
      type: 'identify',
      context: {
        traits: {
          phone: '1234567890'
        }
      }
    })

    const mapping = {
      programId: 456,
      channelIdentifier: 'mobile-number',
      mobileNumberIdentifier: {
        '@path': '$.context.traits.phone'
      }
    }

    await expect(
      testDestination.testAction('enrollContact', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })
})