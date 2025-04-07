import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import sfmc from '../index'
import { Settings } from '../generated-types'

beforeEach(() => nock.cleanAll())

const testDestination = createTestIntegration(sfmc)
const settings: Settings = {
  subdomain: 'test123',
  client_id: 'test123',
  client_secret: 'test123',
  account_id: 'test123'
}
const requestUrl = `https://${settings.subdomain}.rest.marketingcloudapis.com/hub/v1/dataevents/1234567890/rowset`
const mapping = {
  id: { '@path': '$.properties.id' },
  keys: { '@path': '$.properties.keys' },
  values: { '@path': '$.properties.values' }
}

describe('Multistatus', () => {
  describe('dataExtension', () => {
    it('should successfully handle a batch of events with complete success response from SFMC API', async () => {
      const responseData = [{ message: 'Success for event 1' }, { message: 'Success for event 2' }]
      nock(requestUrl).post('').reply(200, responseData)

      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            id: '1234567890',
            keys: {
              id: 'HS1'
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        // Valid Event
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            id: '123456789',
            keys: {
              id: 'HP1'
            },
            values: {
              name: 'Harry Potter'
            }
          }
        })
      ]

      const response = await testDestination.executeBatch('dataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        sent: {
          keys: {
            id: 'HS1'
          },
          values: {
            name: 'Harry Styles'
          }
        },
        body: { message: 'Success for event 1' }
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: { message: 'Success for event 2' },
        sent: {
          keys: {
            id: 'HP1'
          },
          values: {
            name: 'Harry Potter'
          }
        }
      })
    })
    it('should handle the case where both key and id are missing', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            keys: {
              id: 'HS1'
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'harry-2',
          properties: {
            keys: {
              id: 'HP1'
            },
            values: {
              name: 'Harry Potter'
            }
          }
        }) // No key and id provided
      ]

      const response = await testDestination.executeBatch('dataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.',
        errorreporter: 'INTEGRATIONS'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.',
        errorreporter: 'INTEGRATIONS'
      })
    })
    it('should handle multistatus errors when some events fail with specific error messages', async () => {
      const errorResponse = {
        status: 400,
        message: 'Invalid keys for ID: HS1',
        additionalErrors: [
          {
            message: 'No record found for ID: HS2'
          }
        ]
      }

      nock(requestUrl).post('').reply(400, errorResponse)

      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            id: '1234567890',
            keys: {
              id: 'HS1' // Valid key
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'harry-2',
          properties: {
            id: '1234567890',
            keys: {
              id: 'HS2' // Invalid key
            },
            values: {
              name: 'Harry Potter'
            }
          }
        })
      ]

      const response = await testDestination.executeBatch('dataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'No record found for ID: HS2',
        errorreporter: 'DESTINATION'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'No record found for ID: HS2',
        errorreporter: 'DESTINATION'
      })
    })
    it('should handle multistatus errors and set correct status code', async () => {
      const errorResponse = {
        status: 429,
        message: 'Invalid keys',
        additionalErrors: [
          {
            message: 'No record found'
          }
        ]
      }

      nock(requestUrl).post('').reply(429, errorResponse)

      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            id: '1234567890',
            keys: {
              id: 'HS1' // Valid key
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'harry-2',
          properties: {
            id: '1234567890',
            keys: {
              id: 'HS2' // Invalid key
            },
            values: {
              name: 'Harry Potter'
            }
          }
        })
      ]

      const response = await testDestination.executeBatch('dataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 429,
        errortype: 'TOO_MANY_REQUESTS',
        errormessage: 'No record found',
        errorreporter: 'DESTINATION',
        sent: {
          keys: {
            id: 'HS1'
          },
          values: {
            name: 'Harry Styles'
          }
        }
      })

      expect(response[1]).toMatchObject({
        status: 429,
        errortype: 'TOO_MANY_REQUESTS',
        errormessage: 'No record found',
        errorreporter: 'DESTINATION',
        sent: {
          keys: {
            id: 'HS2'
          },
          values: {
            name: 'Harry Potter'
          }
        }
      })
    })
  })

  describe('contactDataExtension', () => {
    it('should successfully handle a batch of events with complete success response from SFMC API', async () => {
      const responseData = [{ message: 'Success for event 1' }, { message: 'Success for event 2' }]
      nock(requestUrl).post('').reply(200, responseData)

      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          properties: {
            id: '1234567890',
            keys: {
              contactKey: 'harry-1',
              id: 'HS1'
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          properties: {
            id: '1234567890',
            keys: {
              contactKey: 'harry-2',
              id: 'HP1'
            },
            values: {
              name: 'Harry Potter'
            }
          }
        })
      ]

      const response = await testDestination.executeBatch('contactDataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 200,
        sent: {
          keys: {
            contactKey: 'harry-1',
            id: 'HS1'
          },
          values: {
            name: 'Harry Styles'
          }
        },
        body: { message: 'Success for event 1' }
      })

      expect(response[1]).toMatchObject({
        status: 200,
        sent: {
          keys: {
            contactKey: 'harry-2',
            id: 'HP1'
          },
          values: {
            name: 'Harry Potter'
          }
        },
        body: { message: 'Success for event 2' }
      })
    })

    it('should handle the case where both key and id are missing', async () => {
      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            keys: {
              contactKey: 'harry-1',
              id: 'HS1'
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'harry-2',
          properties: {
            keys: {
              contactKey: 'harry-2',
              id: 'HP1'
            },
            values: {
              name: 'Harry Potter'
            }
          }
        }) // No key and id provided
      ]

      const response = await testDestination.executeBatch('contactDataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.',
        errorreporter: 'INTEGRATIONS'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage:
          'In order to send an event to a data extension either Data Extension ID or Data Extension Key must be defined.',
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should handle multistatus errors when some events fail with specific error messages', async () => {
      const errorResponse = {
        status: 400,
        message: 'Invalid keys for ID: HS1',
        additionalErrors: [
          {
            message: 'No record found for ID: HS2'
          }
        ]
      }

      nock(requestUrl).post('').reply(400, errorResponse)

      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            id: '1234567890',
            keys: {
              contactKey: 'harry-1',
              id: 'HS1'
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'harry-2',
          properties: {
            id: '1234567890',
            keys: {
              contactKey: 'harry-2',
              id: 'HS2'
            },
            values: {
              name: 'Harry Potter'
            }
          }
        })
      ]

      const response = await testDestination.executeBatch('contactDataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'No record found for ID: HS2',
        errorreporter: 'DESTINATION'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'BAD_REQUEST',
        errormessage: 'No record found for ID: HS2',
        errorreporter: 'DESTINATION'
      })
    })

    it('should handle multistatus errors and set correct status code', async () => {
      const errorResponse = {
        status: 429,
        message: 'Invalid keys',
        additionalErrors: [
          {
            message: 'No record found'
          }
        ]
      }

      nock(requestUrl).post('').reply(429, errorResponse)

      const events: SegmentEvent[] = [
        createTestEvent({
          type: 'track',
          userId: 'harry-1',
          properties: {
            id: '1234567890',
            keys: {
              contactKey: 'harry-1',
              id: 'HS1'
            },
            values: {
              name: 'Harry Styles'
            }
          }
        }),
        createTestEvent({
          type: 'track',
          userId: 'harry-2',
          properties: {
            id: '1234567890',
            keys: {
              contactKey: 'harry-2',
              id: 'HS2'
            },
            values: {
              name: 'Harry Potter'
            }
          }
        })
      ]

      const response = await testDestination.executeBatch('contactDataExtension', {
        events,
        settings,
        mapping
      })

      expect(response[0]).toMatchObject({
        status: 429,
        errortype: 'TOO_MANY_REQUESTS',
        errormessage: 'No record found',
        errorreporter: 'DESTINATION',
        sent: {
          keys: {
            contactKey: 'harry-1',
            id: 'HS1'
          },
          values: {
            name: 'Harry Styles'
          }
        }
      })

      expect(response[1]).toMatchObject({
        status: 429,
        errortype: 'TOO_MANY_REQUESTS',
        errormessage: 'No record found',
        errorreporter: 'DESTINATION',
        sent: {
          keys: {
            contactKey: 'harry-2',
            id: 'HS2'
          },
          values: {
            name: 'Harry Potter'
          }
        }
      })
    })
  })

  it('should handle non-http error responses gracefully', async () => {
    const errorResponse = {
      message: 'Network Error',
      code: 'ECONNREFUSED'
    }

    nock(requestUrl).post('').replyWithError(errorResponse)

    const events: SegmentEvent[] = [
      createTestEvent({
        type: 'track',
        userId: 'harry-1',
        properties: {
          id: '1234567890',
          keys: {
            contactKey: 'harry-1',
            id: 'HS1'
          },
          values: {
            name: 'Harry Styles'
          }
        }
      })
    ]

    const response = await testDestination.executeBatch('contactDataExtension', {
      events,
      settings,
      mapping,
      statsContext: {
        statsClient: {
          incr: jest.fn(),
          histogram: jest.fn(),
          set: jest.fn(),
          _tags: jest.fn(),
          observe: jest.fn(),
          _name: jest.fn()
        },
        tags: []
      }
    })

    expect(response[0]).toMatchObject({
      status: 500,
      errortype: 'INTERNAL_SERVER_ERROR',
      errormessage:
        'request to https://test123.rest.marketingcloudapis.com/hub/v1/dataevents/1234567890/rowset failed, reason: Network Error'
    })
  })
})
