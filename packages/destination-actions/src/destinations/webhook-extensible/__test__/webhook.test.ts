import nock from 'nock'
import {
  PayloadValidationError,
  createTestEvent,
  createTestIntegration,
  DestinationDefinition
} from '@segment/actions-core'
import Webhook from '../index'

// Exported so we can re-use to test webhook-audiences
export const baseWebhookTests = (def: DestinationDefinition<any>) => {
  const testDestination = createTestIntegration(def)
  describe(def.name, () => {
    describe('send', () => {
      it('should work with default mapping', async () => {
        const url = 'https://example.com'
        const event = createTestEvent()

        nock(url)
          .post('/', event as any)
          .reply(200)

        const responses = await testDestination.testAction('send', {
          event,
          mapping: {
            url
          },
          useDefaultMappings: true
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('supports customizations', async () => {
        const url = 'https://example.build'
        const event = createTestEvent()
        const headerField = 'Custom-Header'
        const headerValue = 'Custom-Value'
        const data = { cool: true }

        nock(url).put('/', data).matchHeader(headerField, headerValue).reply(200)

        const responses = await testDestination.testAction('send', {
          event,
          mapping: {
            url,
            method: 'PUT',
            headers: { [headerField]: headerValue },
            data
          }
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('should throw an error when header value is invalid', async () => {
        const url = 'https://example.build'
        const event = createTestEvent()
        const headerField = 'Custom-Header'
        const headerValue = 'هيثم'
        const data = { cool: true }

        nock(url)
          .put('/', data)
          .matchHeader(headerField, headerValue)
          .replyWithError('TypeError: هيثم is not a legal HTTP header value')

        await expect(
          testDestination.testAction('send', {
            event,
            mapping: {
              url,
              method: 'PUT',
              headers: { [headerField]: headerValue },
              data
            }
          })
        ).rejects.toThrow(PayloadValidationError)
      })
    })
  })
}

baseWebhookTests(Webhook)
