import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

export const settings = {
  api_host: 'https://r1-api.dotdigital.com',
  username: 'api_username',
  password: 'api_password'
}

describe('Send email campaign', () => {
  it('should send campaign with send time optimised option', async () => {
    // Mock getContact function
    nock(settings.api_host)
      .get('/contacts/v3/email/test@example.com')
      .reply(200, { contactId: '123'}); // Correct format for lists

    // Mock send time optimised campaign function
    nock(settings.api_host)
      .post(`/v2/campaigns/send-time-optimised`)
      .reply(200);

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'test@example.com'
        }
      }
    });

    const mapping = {
      campaignId: 123456,
      sendTimeOptimised: true,
      email: {
        '@path': '$.context.traits.email'
      }
    };

    await expect(
      testDestination.testAction('sendEmailCampaign', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError();
  });

  it('should send campaign without send time optimised option', async () => {
    // Mock getContact function
    nock(settings.api_host)
      .get('/contacts/v3/email/test@example.com')
      .reply(200, { contactId: '123'}); // Correct format for lists

    // Mock send time optimised campaign function
    nock(settings.api_host)
      .post(`/v2/campaigns/send`)
      .reply(200);

    const event = createTestEvent({
      type: 'track',
      context: {
        traits: {
          email: 'test@example.com'
        }
      }
    });

    const mapping = {
      campaignId: 123456,
      sendTimeOptimised: false,
      email: {
        '@path': '$.context.traits.email'
      }
    };

    await expect(
      testDestination.testAction('sendEmailCampaign', {
        event,
        mapping,
        settings
      })
    ).resolves.not.toThrowError();
  });
});
