import nock from 'nock'
import { createTestEvent, createTestIntegration } from '@segment/actions-core'
import type { StatsContext } from '@segment/actions-core'
import { fromBinary } from '@bufbuild/protobuf'
import Destination from '../index'
import { UpdateUsersDataRequestSchema, UserIdType } from '../proto/protofile'

const UPLOAD_HOST = 'https://cm.g.doubleclick.net'
const UPLOAD_PATH = '/upload?nid=segment'
const EXTERNAL_AUDIENCE_ID = 'products/DISPLAY_VIDEO_ADVERTISER/customers/123/userLists/456'

const testDestination = createTestIntegration(Destination)

const mockStatsClient = {
  incr: jest.fn(),
  observe: jest.fn(),
  _name: jest.fn(),
  _tags: jest.fn(),
  histogram: jest.fn(),
  set: jest.fn()
}

const mockStatsContext: StatsContext = {
  statsClient: mockStatsClient,
  tags: []
}

// The request body sent to Google's bulk uploader is a raw protobuf-encoded binary payload
// (Content-Type: application/octet-stream), not JSON. Since the payload is generally not valid
// UTF-8, nock hands the interceptor the raw bytes hex-encoded (see nock's
// `requestBodyIsUtf8Representable` handling) instead of mangling it through a lossy utf8 decode.
// Decoding it back with the same protobuf schema used by the destination lets us assert on the
// real wire body rather than just checking that the call didn't throw.
function decodeRequestBody(body: string) {
  const buffer = /^[0-9a-f]+$/i.test(body) ? Buffer.from(body, 'hex') : Buffer.from(body, 'utf8')
  return fromBinary(UpdateUsersDataRequestSchema, buffer)
}

describe('Display Video 360 addToAudience', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    nock.cleanAll()
  })

  it('sends an add operation for every identifier present on the payload', async () => {
    let capturedBody = ''
    nock(UPLOAD_HOST)
      .post(UPLOAD_PATH, (body) => {
        capturedBody = body
        return true
      })
      .reply(200)

    const event = createTestEvent({
      type: 'track',
      event: 'Audience Entered',
      anonymousId: 'my-anon-id-42',
      context: {
        personas: { external_audience_id: EXTERNAL_AUDIENCE_ID },
        device: { advertisingId: '3b6e47b3-1437-4ba2-b3c9-446e4d0cd1e5' },
        DV360: { google_gid: 'CAESEHIV8HXNp0pFdHgi2rElMfk' }
      }
    })

    const responses = await testDestination.testAction('addToAudience', {
      event,
      statsContext: mockStatsContext,
      mapping: {
        external_audience_id: { '@path': '$.context.personas.external_audience_id' },
        mobile_advertising_id: { '@path': '$.context.device.advertisingId' },
        google_gid: { '@path': '$.context.DV360.google_gid' },
        partner_provided_id: { '@path': '$.anonymousId' },
        enable_batching: true
      }
    })

    expect(responses.length).toBe(1)
    expect(responses[0].status).toBe(200)

    const decoded = decodeRequestBody(capturedBody)
    expect(decoded.ops).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userId: 'CAESEHIV8HXNp0pFdHgi2rElMfk',
          userIdType: UserIdType.GOOGLE_USER_ID,
          userListId: 456n,
          delete: false
        }),
        expect.objectContaining({
          userId: '3b6e47b3-1437-4ba2-b3c9-446e4d0cd1e5',
          userIdType: UserIdType.IDFA,
          userListId: 456n,
          delete: false
        }),
        expect.objectContaining({
          userId: 'my-anon-id-42',
          userIdType: UserIdType.PARTNER_PROVIDED_ID,
          userListId: 456n,
          delete: false
        })
      ])
    )
    expect(decoded.ops).toHaveLength(3)
  })

  describe('presets', () => {
    it('should route the "Journeys Step Entered" preset through addToAudience with the correct payload', async () => {
      const preset = Destination.presets?.find((p) => p.name === 'Journeys Step Entered')
      if (!preset) {
        throw new Error('Expected to find preset')
      }
      expect(preset?.partnerAction).toBe('addToAudience')
      expect(preset?.type).toBe('specificEvent')
      expect((preset as { eventSlug?: string })?.eventSlug).toBe('journeys_step_entered_track')

      let capturedBody = ''
      nock(UPLOAD_HOST)
        .post(UPLOAD_PATH, (body) => {
          capturedBody = body
          return true
        })
        .reply(200)

      // A realistic Journeys "step entered" track event. This preset is matched purely by
      // eventSlug (no FQL `subscribe` filter), so what matters here is that the fields the
      // preset's mapping reads from are present.
      const event = createTestEvent({
        type: 'track',
        event: 'Journey Step Entered',
        anonymousId: 'journey-anon-id-99',
        properties: {
          journey_metadata: {
            journey_id: 'test-journey-id',
            journey_name: 'test-journey-name',
            step_id: 'test-step-id',
            step_name: 'test-step-name'
          }
        },
        context: {
          personas: { external_audience_id: EXTERNAL_AUDIENCE_ID },
          device: { advertisingId: 'journey-device-1234-abcd' },
          DV360: { google_gid: 'journey-google-gid-001' }
        }
      })

      const responses = await testDestination.testAction(preset.partnerAction, {
        event,
        statsContext: mockStatsContext,
        mapping: preset.mapping,
        useDefaultMappings: false
      })

      expect(responses.length).toBe(1)
      expect(responses[0].status).toBe(200)

      const decoded = decodeRequestBody(capturedBody)
      expect(decoded.ops).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            userId: 'journey-google-gid-001',
            userIdType: UserIdType.GOOGLE_USER_ID,
            userListId: 456n,
            delete: false
          }),
          expect.objectContaining({
            userId: 'journey-device-1234-abcd',
            userIdType: UserIdType.IDFA,
            userListId: 456n,
            delete: false
          }),
          expect.objectContaining({
            userId: 'journey-anon-id-99',
            userIdType: UserIdType.PARTNER_PROVIDED_ID,
            userListId: 456n,
            delete: false
          })
        ])
      )
      expect(decoded.ops).toHaveLength(3)
    })
  })
})
