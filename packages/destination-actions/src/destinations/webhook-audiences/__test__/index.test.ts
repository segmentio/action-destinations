import WebhookAudience from '../index'
import { baseWebhookTests } from '../../webhook/__test__/webhook.test'
import nock from 'nock'
import { createTestEvent, createTestIntegration, IntegrationError } from '@segment/actions-core'

baseWebhookTests(WebhookAudience)

const testDestination = createTestIntegration(WebhookAudience)
describe('Webhook Audience Tests', () => {
  describe('createAudience', () => {
    it('should fail if no audience name is set', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      await expect(
        testDestination.createAudience({
          audienceName: '',
          audienceSettings: {},
          settings: { createAudienceUrl: fakeUrl }
        })
      ).rejects.toThrowError(IntegrationError)
    })

    it('should fail if no createAudienceUrl is set', async () => {
      await expect(
        testDestination.createAudience({
          audienceName: 'My Cool Audience',
          audienceSettings: {},
          settings: {}
        })
      ).rejects.toThrowError(IntegrationError)
    })

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

    it('should fail when response is missing externalId', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      const exampleRequest = {
        audienceName: 'My Cool Audience',
        nice: 'ok'
      }
      const exampleResponse = {
        // Missing externalId
        someOtherField: 'abc123xyz'
      }
      nock(fakeUrl).post('/', exampleRequest).reply(200, exampleResponse)

      await expect(
        testDestination.createAudience({
          audienceName: 'My Cool Audience',
          audienceSettings: {
            extras: JSON.stringify({ nice: 'ok' })
          },
          settings: { createAudienceUrl: fakeUrl }
        })
      ).rejects.toThrowError(IntegrationError)
    })

    it('should fail with error message including status code when response is invalid JSON', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      nock(fakeUrl).post('/').reply(200, 'Not valid JSON')

      await expect(
        testDestination.createAudience({
          audienceName: 'My Cool Audience',
          audienceSettings: {},
          settings: { createAudienceUrl: fakeUrl }
        })
      ).rejects.toThrow(/status: 200/)
    })

    it('should fail on server error', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      nock(fakeUrl).post('/').reply(500, { error: 'Internal Server Error' })

      await expect(
        testDestination.createAudience({
          audienceName: 'My Cool Audience',
          audienceSettings: {},
          settings: { createAudienceUrl: fakeUrl }
        })
      ).rejects.toThrow()
    })

    it('should fail when extras contains invalid JSON', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      await expect(
        testDestination.createAudience({
          audienceName: 'My Cool Audience',
          audienceSettings: {
            extras: 'not valid json{'
          },
          settings: { createAudienceUrl: fakeUrl }
        })
      ).rejects.toThrow(/Invalid extraSettings JSON/)
    })

    it('should handle missing externalId with proper error wrapping', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      nock(fakeUrl).post('/').reply(200, { someOtherField: 'value' })

      await expect(
        testDestination.createAudience({
          audienceName: 'My Cool Audience',
          audienceSettings: {},
          settings: { createAudienceUrl: fakeUrl }
        })
      ).rejects.toThrow(/Invalid response from create audience request/)
    })
  })

  describe('getAudience', () => {
    it('should fail if no getAudienceUrl is set', async () => {
      await expect(
        testDestination.getAudience({
          externalId: 'abc123xyz',
          settings: {},
          audienceSettings: {}
        })
      ).rejects.toThrowError(IntegrationError)
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

    it('should fail when response is missing externalId', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      const exampleRequest = {
        externalId: 'abc123xyz',
        nice: 'ok'
      }
      const exampleResponse = {
        // Missing externalId
        someOtherField: 'data'
      }
      nock(fakeUrl).post('/', exampleRequest).reply(200, exampleResponse)

      await expect(
        testDestination.getAudience({
          externalId: 'abc123xyz',
          settings: { getAudienceUrl: fakeUrl },
          audienceSettings: {
            extras: JSON.stringify({ nice: 'ok' })
          }
        })
      ).rejects.toThrowError(IntegrationError)
    })

    it('should fail with error message including status code when response is invalid JSON', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      nock(fakeUrl).post('/').reply(200, 'Not valid JSON')

      await expect(
        testDestination.getAudience({
          externalId: 'abc123xyz',
          settings: { getAudienceUrl: fakeUrl },
          audienceSettings: {}
        })
      ).rejects.toThrow(/status: 200/)
    })

    it('should fail on server error', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      nock(fakeUrl).post('/').reply(404, { error: 'Not Found' })

      await expect(
        testDestination.getAudience({
          externalId: 'abc123xyz',
          settings: { getAudienceUrl: fakeUrl },
          audienceSettings: {}
        })
      ).rejects.toThrow()
    })

    it('should fail when extras contains invalid JSON', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      await expect(
        testDestination.getAudience({
          externalId: 'abc123xyz',
          settings: { getAudienceUrl: fakeUrl },
          audienceSettings: {
            extras: 'not valid json{'
          }
        })
      ).rejects.toThrow(/Invalid extraSettings JSON/)
    })

    it('should handle missing externalId with proper error wrapping', async () => {
      const fakeUrl = 'http://segmentfake.xyz'
      nock(fakeUrl).post('/').reply(200, { someOtherField: 'value' })

      await expect(
        testDestination.getAudience({
          externalId: 'abc123xyz',
          settings: { getAudienceUrl: fakeUrl },
          audienceSettings: {}
        })
      ).rejects.toThrow(/Invalid response from get audience request/)
    })
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
