import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import Destination from '../../index'

const testDestination = createTestIntegration(Destination)

const BASE_ENDPOINT = 'https://dev.visualwebsiteoptimizer.com'
const accountId = 654331
const wingifyUuid = 'ABC123'
const SDK_KEY = 'sample-api-key'
const SANITISED_USERID = '57CC1A3D57215E67824E461010E43F53'

describe('Wingify.trackEvent Web', () => {
  describe('Only required parameters', () => {
    it('should send send event call to Wingify', async () => {
      const event = createTestEvent({
        event: 'testEvent',
        properties: {
          wingifyUuid: wingifyUuid
        }
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          wingifyAccountId: accountId,
          apikey: ''
        }
      })
      const page = event.context?.page
      const expectedRequest = {
        d: {
          visId: wingifyUuid,
          event: {
            props: {
              page,
              isCustomEvent: true,
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
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

    it('should send segment properties as Wingify properties', async () => {
      const event = createTestEvent({
        event: 'testEvent',
        properties: {
          wingifyUuid: wingifyUuid,
          amount: 100,
          currency: 'INR',
          outbound: true
        }
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
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
              amount: 100,
              currency: 'INR',
              outbound: true,
              page,
              isCustomEvent: true,
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
          }
        }
      }
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject(expectedRequest)
    })
  })

  describe('All parameters', () => {
    it('should send send event call to Wingify', async () => {
      const event = createTestEvent({
        event: 'testEvent',
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
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
        event,
        useDefaultMappings: true,
        settings: {
          wingifyAccountId: accountId,
          apikey: ''
        }
      })
      const page = event.context?.page
      const expectedRequest = {
        d: {
          visId: wingifyUuid,
          event: {
            props: {
              page,
              isCustomEvent: true,
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
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

    it('should send segment properties as Wingify properties', async () => {
      const event = createTestEvent({
        event: 'testEvent',
        properties: {
          wingifyUuid: wingifyUuid,
          amount: 100,
          currency: 'INR',
          outbound: true
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
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
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
              amount: 100,
              currency: 'INR',
              outbound: true,
              page,
              isCustomEvent: true,
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
          }
        }
      }
      expect(responses[0].status).toBe(200)
      expect(responses[0].options.json).toMatchObject(expectedRequest)
    })
  })
})

describe('Wingify.trackEvent Fullstack', () => {
  describe('Only required parameters', () => {
    it('should send send event call to Wingify', async () => {
      const event = createTestEvent({
        event: 'testEvent',
        properties: {
          wingifyUuid: wingifyUuid
        }
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
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
              page,
              isCustomEvent: true,
              $visitor: {
                props: {
                  wingify_fs_environment: 'sample-api-key'
                }
              },
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
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

    it('should send segment properties as Wingify properties', async () => {
      const event = createTestEvent({
        event: 'testEvent',
        properties: {
          wingifyUuid: wingifyUuid,
          amount: 100,
          currency: 'INR',
          outbound: true
        }
      })
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
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
              amount: 100,
              currency: 'INR',
              outbound: true,
              page,
              isCustomEvent: true,
              $visitor: {
                props: {
                  wingify_fs_environment: 'sample-api-key'
                }
              },
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
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
    })
  })

  describe('All Parameters', () => {
    it('should send send event call to Wingify', async () => {
      const event = createTestEvent({
        event: 'testEvent',
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
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
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
              page,
              isCustomEvent: true,
              $visitor: {
                props: {
                  wingify_fs_environment: 'sample-api-key'
                }
              },
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
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

    it('should send segment properties as Wingify properties', async () => {
      const event = createTestEvent({
        event: 'testEvent',
        properties: {
          wingifyUuid: wingifyUuid,
          amount: 100,
          currency: 'INR',
          outbound: true
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
      nock(BASE_ENDPOINT).post(`/events/t?en=segment.testEvent&a=${accountId}`).reply(200, {})
      const responses = await testDestination.testAction('trackEvent', {
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
              amount: 100,
              currency: 'INR',
              outbound: true,
              page,
              isCustomEvent: true,
              $visitor: {
                props: {
                  wingify_fs_environment: 'sample-api-key'
                }
              },
              wingifyMeta: {
                source: 'segment.cloud',
                ogName: 'testEvent',
                metric: {}
              }
            },
            name: 'segment.testEvent'
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
    })
  })
})
