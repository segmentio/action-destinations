import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Add Contact To List', () => {
  it('should add contact to list with email identifier', async () => {
    // Mock upsertContact function
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
      testDestination.testAction('addContactToList', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })

  it('should add contact to list with mobile number identifier', async () => {
    // Mock upsertContact  function
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
      testDestination.testAction('addContactToList', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError()
  })
})
