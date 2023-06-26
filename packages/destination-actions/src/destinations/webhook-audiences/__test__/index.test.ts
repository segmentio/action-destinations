import WebhookAudience from '../index'
import { baseWebhookTests } from '../../webhook/__test__/webhook.test'
import nock from 'nock'
import { createTestIntegration } from '@segment/actions-core'

baseWebhookTests(WebhookAudience)

const testDestination = createTestIntegration(WebhookAudience)
describe('Webhook Audience Tests', () => {
  it('creates an audience', async () => {
    const fakeUrl = 'http://segmentfake.xyz'
    const exampleRequest = {
      audienceName: 'My Cool Audience'
    }
    const exampleResponse = {
      externalId: 'abc123xyz'
    }
    nock(fakeUrl).post('/', exampleRequest).reply(200, exampleResponse)

    const expectedResponse = await testDestination.createAudience({
      audienceName: 'My Cool Audience',
      settings: { createAudienceUrl: fakeUrl }
    })

    expect(expectedResponse).toStrictEqual(exampleResponse)
  })

  it('gets an audience', async () => {
    const fakeUrl = 'http://segmentfake.xyz'
    const exampleRequest = {
      externalId: 'abc123xyz'
    }
    const exampleResponse = {
      externalId: 'abc123xyz'
    }
    nock(fakeUrl).post('/', exampleRequest).reply(200, exampleResponse)

    const expectedResponse = await testDestination.getAudience({
      externalId: 'abc123xyz',
      settings: { getAudienceUrl: fakeUrl }
    })

    expect(expectedResponse).toStrictEqual(exampleResponse)
  })
})
