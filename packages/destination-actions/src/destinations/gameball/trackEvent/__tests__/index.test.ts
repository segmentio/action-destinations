import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'
import { endpoints } from '../../util'

const testDestination = createTestIntegration(Destination)
const GAMEBALL_API_KEY = 'test_api_key'
const GAMEBALL_SECRET_KEY = 'test_secret_key'

describe('actions-gameball.trackEvent', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      type: 'track',
      userId: 'TEST_PLAYER',
      event: 'TEST_EVENT',
      properties: {
        mobile: '+20100000000',
        metadata1: 'meta_value_1',
        metadata2: 'meta_value_2'
      }
    });

    nock(endpoints.baseApiUrl).post(endpoints.trackEvent).reply(200, {});

    const responses = await testDestination.testAction('trackEvent', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: GAMEBALL_API_KEY,
        secretKey: GAMEBALL_SECRET_KEY
      }
    });
    expect(responses.length).toBe(1);
    expect(responses[0].status).toBe(200);
    expect(responses[0].data).toMatchObject({});
  });
})
