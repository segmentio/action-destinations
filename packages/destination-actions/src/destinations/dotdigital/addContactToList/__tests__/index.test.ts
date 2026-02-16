import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Add or Update Contact', () => {
  it('should add or update contact with email identifier', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/email/test@example.com?merge-option=overwrite`)
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: {
        traits: {
          email: 'test@example.com'
        }
      }
    })

    const mapping = {
      listId: 123456,
      channelIdentifier: 'email',
      emailIdentifier: {
        '@path': '$.context.traits.email'
      }
    }
    await expect(
      testDestination.testAction('addOrUpdateContact', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })

  it('should add or update contact with mobile number identifier', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/mobileNumber/1234567890?merge-option=overwrite`)
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: {
        traits: {
          phone: '1234567890'
        }
      }
    })

    const mapping = {
      listId: 123456,
      channelIdentifier: 'mobileNumber',
      mobileNumberIdentifier: {
        '@path': '$.context.traits.phone'
      }
    }

    await expect(
      testDestination.testAction('addOrUpdateContact', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })

  it('should not send email status when resubscribe is false', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/email/test@example.com?merge-option=overwrite`, (body) => {
        expect(body.channelProperties.email?.status).toBeUndefined()
        return true
      })
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { email: 'test@example.com' } }
    })

    const mapping = {
      channelIdentifier: 'email',
      emailIdentifier: { '@path': '$.context.traits.email' },
      updateEmailSubscription: true,
      emailSubscriptionStatus: 'subscribed',
      emailResubscribe: false
    }

    await testDestination.testAction('addOrUpdateContact', {
      event,
      mapping,
      settings
    })
  })

  it('should send subscribed status with resubscribe options when emailResubscribe is true', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/email/test@example.com?merge-option=overwrite`, (body) => {
        expect(body.channelProperties.email.status).toBe('subscribed')
        expect(body.channelProperties.email.resubscribeOptions).toEqual({
          resubscribeWithNoChallenge: false
        })
        return true
      })
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { email: 'test@example.com' } }
    })

    const mapping = {
      channelIdentifier: 'email',
      emailIdentifier: { '@path': '$.context.traits.email' },
      updateEmailSubscription: true,
      emailSubscriptionStatus: 'subscribed',
      emailResubscribe: true,
      resubscribeWithoutChallengeEmail: false
    }

    await testDestination.testAction('addOrUpdateContact', {
      event,
      mapping,
      settings
    })
  })

  it('should include locale and redirect URL when resubscribe without challenge is false', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/email/test@example.com?merge-option=overwrite`, (body) => {
        expect(body.channelProperties.email.resubscribeOptions).toEqual({
          resubscribeWithNoChallenge: false,
          preferredLocale: 'en-EN',
          redirectUrlAfterChallenge: 'https://example.com/welcome'
        })
        return true
      })
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { email: 'test@example.com' } }
    })

    const mapping = {
      channelIdentifier: 'email',
      emailIdentifier: { '@path': '$.context.traits.email' },
      updateEmailSubscription: true,
      emailSubscriptionStatus: 'subscribed',
      emailResubscribe: true,
      resubscribeWithoutChallengeEmail: false,
      preferredLocale: 'en-EN',
      redirectUrlAfterChallenge: 'https://example.com/welcome'
    }

    await testDestination.testAction('addOrUpdateContact', {
      event,
      mapping,
      settings
    })
  })

  it('should not include locale and redirect URL when resubscribe without challenge is true', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/email/test@example.com?merge-option=overwrite`, (body) => {
        expect(body.channelProperties.email.resubscribeOptions).toEqual({
          resubscribeWithNoChallenge: true
        })
        return true
      })
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { email: 'test@example.com' } }
    })

    const mapping = {
      channelIdentifier: 'email',
      emailIdentifier: { '@path': '$.context.traits.email' },
      updateEmailSubscription: true,
      emailSubscriptionStatus: 'subscribed',
      emailResubscribe: true,
      resubscribeWithoutChallengeEmail: true
    }

    await testDestination.testAction('addOrUpdateContact', {
      event,
      mapping,
      settings
    })
  })

  it('should send unsubscribed status without resubscribe options', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/email/test@example.com?merge-option=overwrite`, (body) => {
        expect(body.channelProperties.email.status).toBe('unsubscribed')
        expect(body.channelProperties.email.resubscribeOptions).toBeUndefined()
        return true
      })
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { email: 'test@example.com' } }
    })

    const mapping = {
      channelIdentifier: 'email',
      emailIdentifier: { '@path': '$.context.traits.email' },
      updateEmailSubscription: true,
      emailSubscriptionStatus: 'unsubscribed'
    }

    await testDestination.testAction('addOrUpdateContact', {
      event,
      mapping,
      settings
    })
  })

  it('should handle SMS subscription status', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/mobileNumber/1234567890?merge-option=overwrite`, (body) => {
        expect(body.channelProperties.sms.status).toBe('subscribed')
        return true
      })
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { phone: '1234567890' } }
    })

    const mapping = {
      channelIdentifier: 'mobileNumber',
      mobileNumberIdentifier: { '@path': '$.context.traits.phone' },
      updateSmsSubscription: true,
      smsSubscriptionStatus: 'subscribed'
    }

    await testDestination.testAction('addOrUpdateContact', {
      event,
      mapping,
      settings
    })
  })

  it('should not send SMS status when updateSmsSubscription is false', async () => {
    nock(settings.api_host)
      .patch(`/contacts/v3/mobileNumber/1234567890?merge-option=overwrite`, (body) => {
        expect(body.channelProperties.sms).toBeUndefined()
        return true
      })
      .reply(200, { contactId: 123 })

    const event = createTestEvent({
      type: 'identify',
      context: { traits: { phone: '1234567890' } }
    })

    const mapping = {
      channelIdentifier: 'mobileNumber',
      mobileNumberIdentifier: { '@path': '$.context.traits.phone' },
      updateSmsSubscription: false
    }

    await testDestination.testAction('addOrUpdateContact', {
      event,
      mapping,
      settings
    })
  })
})
