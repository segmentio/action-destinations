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
      nock(requestUrl).post('').reply(200, {})

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
            id: '1234567890',
            keys: {
              id: 'HS1'
            },
            values: {
              name: 'Harry Styles'
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
        body: {}
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: {}
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
  })

  describe('contactDataExtension', () => {
    it('should successfully handle a batch of events with complete success response from SFMC API', async () => {
      nock(requestUrl).post('').reply(200, {})

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
        body: {}
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: {}
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
  })
})
