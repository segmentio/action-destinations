import nock from 'nock'
import {
  PayloadValidationError,
  createTestEvent,
  createTestIntegration,
  DestinationDefinition
} from '@segment/actions-core'
import Webhook from '../index'
import { createHmac, timingSafeEqual } from 'crypto'
import { SegmentEvent } from '@segment/actions-core'

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

      it('supports request signing', async () => {
        const url = 'https://example.com'
        const event = createTestEvent({
          properties: { cool: true }
        })
        const payload = JSON.stringify(event.properties)
        const sharedSecret = 'abc123'

        nock(url)
          .post('/', payload)
          .reply(async function (_uri, body) {
            // Normally you should use the raw body but nock automatically
            // deserializes it (and doesn't allow us to access the raw request
            // body) so we re-serialize the body here so that we can demonstrate
            // signture validation.
            const bodyString = JSON.stringify(body)

            // Validate the signature
            const expectSignature = this.req.headers['x-signature'][0]
            const actualSignature = createHmac('sha1', sharedSecret).update(bodyString).digest('hex')

            // Use constant-time comparison to avoid timing attacks
            if (
              expectSignature.length !== actualSignature.length ||
              !timingSafeEqual(Buffer.from(actualSignature, 'hex'), Buffer.from(expectSignature, 'hex'))
            ) {
              return [400, 'Invalid signature']
            }

            return [200, 'OK']
          })

        const responses = await testDestination.testAction('send', {
          event,
          mapping: {
            url,
            data: { '@path': '$.properties' }
          },
          settings: { sharedSecret },
          useDefaultMappings: true
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
      })

      it('supports request signing with batched events', async () => {
        const url = 'https://example.com'

        const events: SegmentEvent[] = [
          createTestEvent({
            properties: { cool: false }
          }),
          createTestEvent({
            properties: { cool: true }
          })
        ]

        const payload = JSON.stringify(events.map(({ properties }) => properties))
        const sharedSecret = 'abc123'
        nock(url)
          .post('/', payload)
          .reply(async function (_uri, body: any) {
            // Normally you should use the raw body but nock automatically
            // deserializes it (and doesn't allow us to access the raw request
            // body) so we re-serialize the body here so that we can demonstrate
            // signture validation

            // Validate the signature
            const expectSignature = this.req.headers['x-signature'][0]
            const actualSignature = createHmac('sha1', sharedSecret).update(JSON.stringify(body[0])).digest('hex')

            // Use constant-time comparison to avoid timing attacks
            if (
              expectSignature.length !== actualSignature.length ||
              !timingSafeEqual(Buffer.from(actualSignature, 'hex'), Buffer.from(expectSignature, 'hex'))
            ) {
              return [400, 'Invalid signature123']
            }

            return [200, 'OK']
          })

        const responses = await testDestination.testBatchAction('send', {
          events,
          mapping: {
            url,
            data: { '@path': '$.properties' }
          },
          settings: { sharedSecret },
          useDefaultMappings: true
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

      it('should incr stats by unique url, headers and method count', async () => {
        const testEvent1 = {
          properties: {
            url: 'https://example.build',
            method: 'POST',
            headers: {
              'sample-header': 'value1'
            }
          }
        }
        const testEvent2 = {
          properties: {
            url: 'https://example.build',
            method: 'PUT',
            headers: {
              'sample-header': 'value1'
            }
          }
        }
        const events = [createTestEvent(testEvent1), createTestEvent(testEvent2)]

        nock(testEvent1.properties.url).post('/').reply(200, { success: true })

        const statsClient = {
          incr: jest.fn(),
          observe: jest.fn(),
          _name: jest.fn(),
          _tags: jest.fn(),
          set: jest.fn,
          histogram: jest.fn()
        }
        const statsContext = {
          statsClient,
          tags: ['test:tag']
        }

        const responses = await testDestination.testBatchAction('send', {
          events,
          mapping: {
            url: {
              '@path': '$.properties.url'
            },
            method: {
              '@path': '$.properties.method'
            },
            headers: {
              'sample-header': {
                '@path': '$.properties.sample-header'
              }
            }
          },
          useDefaultMappings: true,
          statsContext
        })

        expect(responses.length).toBe(1)
        expect(responses[0].status).toBe(200)
        expect(statsClient.histogram).toHaveBeenCalledWith(
          'webhook.configurable_batch_keys.unique_keys',
          2,
          statsContext.tags
        )
      })
    })

    it('should have batch keys default to url, method, headers', () => {
      const action = testDestination.definition.actions.send
      expect(action.fields.batch_keys).toBeDefined()
      expect(action.fields.batch_keys?.default).toBeDefined()
      expect(action.fields.batch_keys?.default).toEqual(['url', 'method', 'headers'])
    })
  })
}

baseWebhookTests(Webhook)
