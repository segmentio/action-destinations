import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

describe('Metronome.sendEvent', () => {
  describe("process", () => {
    it('should send an event', async () => {
      const event = createTestEvent();

      nock('https://api.getmetronome.com').post('/v1/ingest').reply(200)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          apiToken: "mock-api-token",
        },
        mapping: {
          event_type: { '@path': "$.event" },
          properties: { '@path': "$.context" },
        },
      });

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      // TODO: Feels like there should be a lighter weight to do this check
      expect(responses[0].options.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer mock-api-token",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)

      expect(responses[0].options.json).toEqual([
        {
          event_type: event.event,
          customer_id: event?.context?.groupId ?? event.userId ?? event.anonymousId,
          properties: event.context,
          transaction_id: event.messageId,
          timestamp: new Date(event.timestamp ?? "").toISOString(),
        }
      ])
    })


    it('should convert a non rfc3999 timestamp', async () => {
      const event = createTestEvent({
        timestamp: "2021-01-01"
      });

      nock('https://api.getmetronome.com').post('/v1/ingest').reply(200)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          apiToken: "mock-api-token",
        },
        mapping: {
          event_type: { '@path': "$.event" },
          properties: { '@path': "$.context" },
        },
      });

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      // TODO: Feels like there should be a lighter weight to do this check
      expect(responses[0].options.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer mock-api-token",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)
      expect(responses[0].options.json).toEqual([
        {
          event_type: event.event,
          customer_id: event?.context?.groupId ?? event.userId ?? event.anonymousId,
          properties: event.context,
          transaction_id: event.messageId,
          timestamp: "2021-01-01T00:00:00.000Z",
        }
      ])
    })

    it('should convert an epoch timestamp', async () => {
      const event = createTestEvent({
        properties: {
          epoch_timestamp: 1625895431000 // 2021-07-10 05:37:11
        }
      });

      nock('https://api.getmetronome.com').post('/v1/ingest').reply(200)

      const responses = await testDestination.testAction('sendEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          apiToken: "mock-api-token",
        },
        mapping: {
          event_type: { '@path': "$.event" },
          properties: { '@path': "$.context" },
          timestamp: { '@path': "$.properties.epoch_timestamp" },
        },
      });

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      // TODO: Feels like there should be a lighter weight to do this check
      expect(responses[0].options.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "authorization": Array [
              "Bearer mock-api-token",
            ],
            "user-agent": Array [
              "Segment (Actions)",
            ],
          },
        }
      `)
      expect(responses[0].options.json).toEqual([
        {
          event_type: event.event,
          customer_id: event?.context?.groupId ?? event.userId ?? event.anonymousId,
          properties: event.context,
          transaction_id: event.messageId,
          timestamp: "2021-07-10T05:37:11.000Z",
        }
      ])
    })
  })
})
