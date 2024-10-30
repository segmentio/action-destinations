import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Sprig from '../../index'

const testDestination = createTestIntegration(Sprig)

describe('Sprig.identifyUsers', () => {
  it('should flatten payload correctly', async () => {
    const event = createTestEvent({
      type: 'identify',
      userId: '1234',
      traits: {
        firstName: "Bob",
        lastName: "Smith",
        enabledProducts: {
          surveys: true,
          heatmaps: false,
          replays: true,
          feedback: true
        }
      }
    })
    nock('https://api.sprig.com/v2').post('/users').reply(200, {})
    const responses = await testDestination.testAction('identifyUser', {
      event,
      useDefaultMappings: true,
      settings: {
        apiKey: "TEST-API-KEY"
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)
    expect(responses[0].options.json).toMatchObject({
      "userId": "1234",
      "attributes": {
        "firstName": "Bob",
        "lastName": "Smith",
        "enabledProducts.surveys": true,
        "enabledProducts.heatmaps": false,
        "enabledProducts.replays": true,
        "enabledProducts.feedback": true
      }
    })
  })
})
