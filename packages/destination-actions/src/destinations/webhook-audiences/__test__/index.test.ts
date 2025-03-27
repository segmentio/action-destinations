import WebhookAudience from '../index'
import { baseWebhookTests } from '../../webhook/__test__/webhook.test'
import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'

baseWebhookTests(WebhookAudience)

const testDestination = createTestIntegration(WebhookAudience)
describe('Webhook Audience Tests', () => {
  it('creates an audience', async () => {
    const fakeUrl = 'http://segmentfake.xyz'
    const exampleRequest = {
      audienceName: 'My Cool Audience',
      nice: 'ok'
    }
    const exampleResponse = {
      externalId: 'abc123xyz'
    }
    nock(fakeUrl).post('/', exampleRequest).reply(200, exampleResponse)

    const expectedResponse = await testDestination.createAudience({
      audienceName: 'My Cool Audience',
      audienceSettings: {
        extras: JSON.stringify({ nice: 'ok' })
      },
      settings: { createAudienceUrl: fakeUrl }
    })

    expect(expectedResponse).toStrictEqual(exampleResponse)
  })

  it('gets an audience', async () => {
    const fakeUrl = 'http://segmentfake.xyz'
    const exampleRequest = {
      externalId: 'abc123xyz',
      nice: 'ok'
    }
    const exampleResponse = {
      externalId: 'abc123xyz'
    }
    nock(fakeUrl).post('/', exampleRequest).reply(200, exampleResponse)

    const expectedResponse = await testDestination.getAudience({
      externalId: 'abc123xyz',
      settings: { getAudienceUrl: fakeUrl },
      audienceSettings: {
        extras: JSON.stringify({ nice: 'ok' })
      }
    })

    expect(expectedResponse).toStrictEqual(exampleResponse)
  })

  it('send through audience extra settings', async () => {
    const url = 'https://example.com'
    const event = createTestEvent({
      context: {
        personas: {
          audience_settings: {
            extras: JSON.stringify({ nice: 'ok' })
          }
        }
      }
    })

    nock(url)
      .post('/')
      .reply(200, (_, requestBody) => requestBody)

    const responses = await testDestination.testAction('send', {
      event,
      mapping: {
        url
      },
      useDefaultMappings: true
    })

    expect(responses.length).toBe(1)
    const response = responses[0]
    const json = await response.json()
    expect(json['nice']).toBe('ok')
  })
})
