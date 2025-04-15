import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Remove contact from list', () => {
  it('should remove contact from list with email identifier', async () => {
    // Mock getContact function
    nock(settings.api_host)
      .get('/contacts/v3/email/test@example.com')
      .reply(200, { contactId: '123', lists: [{ id: 123456 }] }); // Correct format for lists

    // Mock deleteContactFromList function
    nock(settings.api_host)
      .delete(`/v2/address-books/123456/contacts/123`)
      .reply(204);

    const event = createTestEvent({
      type: 'identify',
      context: {
        traits: {
          email: 'test@example.com'
        }
      }
    });

    const mapping = {
      listId: 123456,
      channelIdentifier: 'email',
      emailIdentifier: {
        '@path': '$.context.traits.email'
      }
    };

    await expect(
      testDestination.testAction('removeContactFromList', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError();
  });

  it('should remove contact from list with mobile number identifier', async () => {
    // Mock getContact function
    nock(settings.api_host)
      .get('/contacts/v3/mobile-number/1234567890')
      .reply(200, { contactId: '123', lists: [{ id: 123456 }] }); // Correct format for lists

    // Mock deleteContactFromList function
    nock(settings.api_host)
      .delete(`/v2/address-books/123456/contacts/123`)
      .reply(204);

    const event = createTestEvent({
      type: 'identify',
      context: {
        traits: {
          phone: '1234567890'
        }
      }
    });

    const mapping = {
      listId: 123456,
      channelIdentifier: 'mobile-number',
      mobileNumberIdentifier: {
        '@path': '$.context.traits.phone'
      }
    };

    await expect(
      testDestination.testAction('removeContactFromList', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError();
  });
});
