import { SegmentEvent, createTestEvent, createTestIntegration } from '@segment/actions-core'
import nock from 'nock'
import Mixpanel from '../index'
import { MixpanelTrackApiResponseType } from '../common/utils'
import { Features } from '@segment/actions-core/mapping-kit'

beforeEach(() => {
  nock.cleanAll()
})

const settings = {
  projectToken: 'test-api-key',
  apiSecret: 'test-proj-token',
  apiRegion: 'US'
}

const END_POINT = 'https://api.mixpanel.com'

const timestamp = '2024-10-25T15:21:15.449Z'

const testDestination = createTestIntegration(Mixpanel)

describe('MultiStatus', () => {
  describe('trackEvent', () => {
    it('should successfully handle a batch of events with complete success response from Mixpanel API', async () => {
      nock(END_POINT).post('/import?strict=1').reply(200, {
        code: 200,
        status: 'Ok',
        num_records_imported: 2
      })

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({ timestamp, event: 'Test event' }),
        createTestEvent({ timestamp, event: 'Test event' })
      ]

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackEvent', {
        events,
        mapping,
        settings,
        features
      })
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'Ok'
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: 'Ok'
      })
    })

    it('should successfully handle a batch of events with partial success response from Mixpanel API', async () => {
      nock(END_POINT)
        .post('/import?strict=1')
        .reply(200, {
          code: 200,
          status: 'Ok',
          num_records_imported: 1,
          failed_records: [
            {
              index: 1,
              insert_id: '13c0b661-f48b-51cd-ba54-97c5999169c0',
              field: 'properties.time',
              message: 'Payload validation error'
            }
          ]
        })

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({ timestamp, event: 'Test event' }),
        // Event without any user identifier
        createTestEvent({ timestamp })
      ]
      delete events[1].event

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackEvent', {
        events,
        mapping,
        settings,
        features
      })

      // The first event doesn't fail as there is no error reported by Mixpanel API
      expect(response[0]).toMatchObject({
        status: 200,
        body: {}
      })

      // The second event fails as pre-request validation fails for not having a valid event name.
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'event'.",
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should successfully handle a batch of events with complete error response from Mixpanel API', async () => {
      nock(END_POINT).post('/import?strict=1').reply(200, {})

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        // InValid Event
        createTestEvent({ timestamp }),
        // Invalid Event
        createTestEvent({ timestamp })
      ]
      delete events[0].event
      delete events[1].event

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackEvent', {
        events,
        mapping,
        settings,
        features
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'event'.",
        errorreporter: 'INTEGRATIONS'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'event'.",
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should successfully handle a batch of events with fatal error response from Mixpanel API', async () => {
      const mockResponse: MixpanelTrackApiResponseType = {
        code: 400,
        status: 'Bad Request',
        num_records_imported: 1,
        failed_records: [
          {
            index: 1,
            insert_id: '13c0b661-f48b-51cd-ba54-97c5999169c0',
            field: 'properties.time',
            message: 'Payload validation error'
          }
        ]
      }
      nock(END_POINT).post('/import?strict=1').reply(400, mockResponse)

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        createTestEvent({ timestamp, event: 'Test event' }),
        createTestEvent({ timestamp, event: 'Test event' })
      ]

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackEvent', {
        events,
        mapping,
        settings,
        features
      })

      expect(response[0]).toMatchObject({
        status: 200,
        body: 'Bad Request',
        sent: {
          event: 'Test event'
        }
      })
      expect(response[1]).toMatchObject({
        status: 400,
        errormessage: 'Payload validation error',
        errortype: 'BAD_REQUEST',
        errorreporter: 'DESTINATION'
      })
    })
    it('should successfully handle a batch of events with fatal error 401 response from Mixpanel API', async () => {
      const mockResponse: MixpanelTrackApiResponseType = {
        code: 401,
        status: 'Invalid credentials',
        error: 'Unauthorized'
      }
      nock(END_POINT).post('/import?strict=1').reply(401, mockResponse)

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        createTestEvent({ timestamp, event: 'Test event' }),
        createTestEvent({ timestamp, event: 'Test event' })
      ]

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackEvent', {
        events,
        mapping,
        settings,
        features
      })

      expect(response).toMatchObject([
        {
          status: 401,
          errormessage: 'Unauthorized',
          errorreporter: 'DESTINATION'
        },
        {
          status: 401,
          errormessage: 'Unauthorized',
          errorreporter: 'DESTINATION'
        }
      ])
    })
  })

  describe('trackPurchase', () => {
    it('should successfully handle a batch of events with complete success response from Mixpanel API', async () => {
      nock(END_POINT).post('/import?strict=1').reply(200, {
        code: 200,
        status: 'Ok',
        num_records_imported: 2
      })

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({ timestamp, event: 'Test event' }),
        createTestEvent({ timestamp, event: 'Test event' })
      ]

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        mapping,
        settings,
        features
      })
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'Ok'
      })

      expect(response[1]).toMatchObject({
        status: 200,
        body: 'Ok'
      })
    })

    it('should successfully handle a batch of events with partial success response from Mixpanel API', async () => {
      nock(END_POINT).post('/import?strict=1').reply(200, {
        code: 200,
        status: 'Ok',
        num_records_imported: 1
      })

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({ timestamp, event: 'Test event' }),
        // Event without any user identifier
        createTestEvent({ timestamp })
      ]
      delete events[1].event

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        mapping,
        settings,
        features
      })

      // The first event doesn't fail as there is no error reported by Mixpanel API
      expect(response[0]).toMatchObject({
        status: 200,
        body: 'Ok'
      })

      // The second event fails as pre-request validation fails for not having a valid event name.
      expect(response[1]).toMatchObject({
        status: 400,
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errormessage: "The root value is missing the required field 'event'.",
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should successfully handle a batch of events with complete error response from Mixpanel API', async () => {
      nock(END_POINT).post('/import?strict=1').reply(200, {})

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        // Valid Event
        createTestEvent({ timestamp }),
        // Event without any user identifier
        createTestEvent({ timestamp })
      ]
      delete events[0].event
      delete events[1].event

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        mapping,
        settings,
        features
      })

      expect(response[0]).toMatchObject({
        status: 400,
        errormessage: "The root value is missing the required field 'event'.",
        errorreporter: 'INTEGRATIONS'
      })

      expect(response[1]).toMatchObject({
        status: 400,
        errormessage: "The root value is missing the required field 'event'.",
        errorreporter: 'INTEGRATIONS'
      })
    })

    it('should successfully handle a batch of events with fatal error response from Mixpanel API', async () => {
      const mockResponse: MixpanelTrackApiResponseType = {
        code: 400,
        status: 'Bad Request',
        num_records_imported: 0,
        failed_records: [
          {
            index: 0,
            insert_id: '13c0b661-f48b-51cd-ba54-97c5999169c0',
            field: 'properties.time',
            message: 'Payload validation error'
          },
          {
            index: 1,
            insert_id: '13c0b661-f48b-51cd-ba54-97c5999169c0',
            field: 'properties.time',
            message: 'Payload validation error'
          }
        ]
      }
      nock(END_POINT).post('/import?strict=1').reply(400, mockResponse)

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        createTestEvent({ timestamp, event: 'Test event' }),
        createTestEvent({ timestamp, event: 'Test event' })
      ]

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        mapping,
        settings,
        features
      })

      expect(response).toMatchObject([
        {
          status: 400,
          errormessage: 'Payload validation error',
          errorreporter: 'DESTINATION'
        },
        {
          status: 400,
          errormessage: 'Payload validation error',
          errorreporter: 'DESTINATION'
        }
      ])
    })

    it('should successfully handle a batch of events with fatal error 401 response from Mixpanel API', async () => {
      const mockResponse: MixpanelTrackApiResponseType = {
        code: 401,
        status: 'Invalid credentials',
        error: 'Unauthorized'
      }
      nock(END_POINT).post('/import?strict=1').reply(401, mockResponse)

      const mapping = {
        event: {
          '@path': '$.event'
        }
      }
      const events: SegmentEvent[] = [
        createTestEvent({ timestamp, event: 'Test event' }),
        createTestEvent({ timestamp, event: 'Test event' })
      ]

      const features: Features = { 'mixpanel-multistatus': true }
      const response = await testDestination.executeBatch('trackPurchase', {
        events,
        mapping,
        settings,
        features
      })

      expect(response).toMatchObject([
        {
          status: 401,
          errormessage: 'Unauthorized',
          errorreporter: 'DESTINATION'
        },
        {
          status: 401,
          errormessage: 'Unauthorized',
          errorreporter: 'DESTINATION'
        }
      ])
    })
  })
})
