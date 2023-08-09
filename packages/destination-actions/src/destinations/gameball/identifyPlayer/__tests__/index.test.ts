import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Destination from '../../index'
import { endpoints } from '../../util'

const testDestination = createTestIntegration(Destination)
const GAMEBALL_API_KEY = 'test_api_key'
const GAMEBALL_SECRET_KEY = 'test_secret_key'

describe('actions-gameball.identifyPlayer', () => {
  it('should validate action fields', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: 'TEST_PLAYER',
      context: {
        campaign: {
          name: 'GB Campaign',
          content: 'sag_organic',
          medium: 'product_sync',
          source: 'google',
          term: ''
        },
        os: {
          name: "iPhone OS"
        },
        device: {
          name: 'maguro'
        }
      },
      traits: {
        mobile: '+20100000000',
        displayName: 'Jon Snow',
        gender: 'M',
        dateOfBirth: '1990-09-20',
        joinDate: '2022-09-20',
        zip: '12345',
        guest: false,
        totalSpent: 1000,
        lastOrderDate: '2023-06-20',
        totalOrders: 100,
        avgOrderAmount: 10,
        tags: 'tag1, tag2, tag3',
        playerCustomAttributes: {
          custom1: 'custome_value'
        }
      }
    });

    nock(endpoints.baseApiUrl).post(endpoints.identifyPlayer).reply(200, {});

    const responses = await testDestination.testAction('identifyPlayer', {
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
