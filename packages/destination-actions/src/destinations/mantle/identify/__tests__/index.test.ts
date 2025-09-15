import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

import { API_URL } from '../../config'

const testDestination = createTestIntegration(Destination)

describe('MantleRevOps.identify', () => {
  it('should identify a customer in mantle', async () => {
    nock(API_URL).post('/identify').reply(200, {})

    const responses = await testDestination.testAction('identify', {
      event: createTestEvent({
        type: 'identify',
        userId: 'test-user-id',
        traits: {
          email: 'test@example.com',
          name: 'test-name',
          platformId: 'test-platform-id',
          myshopifyDomain: 'test-shopify-domain'
        }
      }),
      settings: {
        appId: 'fake-app-id',
        apiKey: 'fake-api-key'
      },
      mapping: {
        email: {
          '@path': '$.traits.email'
        },
        name: {
          '@path': '$.traits.name'
        },
        platformId: {
          '@path': '$.traits.platformId'
        },
        myshopifyDomain: {
          '@path': '$.traits.myshopifyDomain'
        },
        useDefaultMappings: true
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      platform: 'shopify',
      platformId: 'test-platform-id',
      myshopifyDomain: 'test-shopify-domain',
      email: 'test@example.com',
      name: 'test-name'
    })
  })
})
