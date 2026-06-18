import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const BASE_ENDPOINT = 'https://dev.visualwebsiteoptimizer.com'
const accountId = 654331
const wingifyUuid = 'ABC123'
const EVENT_NAME = 'segment.pageView'
const SDK_KEY = 'sample-api-key'
const SANITISED_USERID = '57CC1A3D57215E67824E461010E43F53'

describe('Wingify.pageVisit Web', () => {
  describe('Only required parameters', () => {
    it('should send Page Visit event to Wingify', async () => {
      const event = createTestEvent({
        properties: {
          wingifyUuid: wingifyUuid
        }
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=${EVENT_NAME}&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('pageVisit', {
        event,
        useDefaultMappings: true,
        settings: {
          wingifyAccountId: accountId
        }
      })
      const page = event.context?.page
      const expectedRequest = {
        d: {
          visId: wingifyUuid,
          event: {
            props: {
              url: page?.url,
              page,
              isCustomEvent: false,
              wingifyMeta: {
                metric: {}
              }
            },
            name: EVENT_NAME
          }
        }
      }
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject(expectedRequest)
      expect(responses[0].options.headers).toMatchInlineSnapshot(`
              Headers {
                Symbol(map): Object {
                  "user-agent": Array [
                    "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
                  ],
                  "x-forwarded-for": Array [
                    "8.8.8.8",
                  ],
                },
              }
          `)
    })
  })

  describe('All Parameters', () => {
    it('should send Page Visit event to Wingify', async () => {
      const event = createTestEvent({
        properties: {
          wingifyUuid: wingifyUuid
        },
        context: {
          page: {
            url: 'www.abc.com'
          },
          ip: '0.0.0.0',
          userAgent: 'Segment'
        },
        timestamp: '2023-05-09T13:12:44.924Z'
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=${EVENT_NAME}&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('pageVisit', {
        event,
        useDefaultMappings: true,
        settings: {
          wingifyAccountId: accountId
        }
      })
      const page = event.context?.page
      const expectedRequest = {
        d: {
          visId: wingifyUuid,
          event: {
            props: {
              url: 'www.abc.com',
              page,
              isCustomEvent: false,
              wingifyMeta: {
                metric: {}
              }
            },
            name: EVENT_NAME
          }
        }
      }
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject(expectedRequest)
      expect(responses[0].options.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "user-agent": Array [
              "Segment",
            ],
            "x-forwarded-for": Array [
              "0.0.0.0",
            ],
          },
        }
      `)
    })
  })
})

describe('Wingify.pageVisit Fullstack', () => {
  describe('Only required parameters', () => {
    it('should send Page Visit event to Wingify', async () => {
      const event = createTestEvent({
        properties: {
          wingifyUuid: wingifyUuid
        }
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=${EVENT_NAME}&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('pageVisit', {
        event,
        useDefaultMappings: true,
        settings: {
          wingifyAccountId: accountId,
          apikey: SDK_KEY
        }
      })
      const page = event.context?.page
      const expectedRequest = {
        d: {
          visId: SANITISED_USERID,
          event: {
            props: {
              url: page?.url,
              page,
              isCustomEvent: false,
              $visitor: {
                props: {
                  wingify_fs_environment: 'sample-api-key'
                }
              },
              wingifyMeta: {
                metric: {}
              }
            },
            name: EVENT_NAME
          },
          visitor: {
            props: {
              wingify_fs_environment: 'sample-api-key'
            }
          }
        }
      }
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject(expectedRequest)
      expect(responses[0].options.headers).toMatchInlineSnapshot(`
            Headers {
              Symbol(map): Object {
                "user-agent": Array [
                  "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1",
                ],
                "x-forwarded-for": Array [
                  "8.8.8.8",
                ],
              },
            }
        `)
    })
  })

  describe('All parameters', () => {
    it('should send Page Visit event to Wingify', async () => {
      const event = createTestEvent({
        properties: {
          wingifyUuid: wingifyUuid
        },
        context: {
          page: {
            url: 'www.abc.com'
          },
          ip: '0.0.0.0',
          userAgent: 'Segment'
        },
        timestamp: '2023-05-09T13:12:44.924Z'
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=${EVENT_NAME}&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('pageVisit', {
        event,
        useDefaultMappings: true,
        settings: {
          wingifyAccountId: accountId,
          apikey: SDK_KEY
        }
      })
      const page = event.context?.page
      const expectedRequest = {
        d: {
          visId: SANITISED_USERID,
          event: {
            props: {
              url: 'www.abc.com',
              page,
              isCustomEvent: false,
              $visitor: {
                props: {
                  wingify_fs_environment: 'sample-api-key'
                }
              },
              wingifyMeta: {
                metric: {}
              }
            },
            name: EVENT_NAME
          },
          visitor: {
            props: {
              wingify_fs_environment: 'sample-api-key'
            }
          }
        }
      }
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject(expectedRequest)
      expect(responses[0].options.headers).toMatchInlineSnapshot(`
        Headers {
          Symbol(map): Object {
            "user-agent": Array [
              "Segment",
            ],
            "x-forwarded-for": Array [
              "0.0.0.0",
            ],
          },
        }
      `)
    })
  })
})
