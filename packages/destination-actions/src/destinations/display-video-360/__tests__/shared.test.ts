import nock from 'nock'
import {
  buildHeaders,
  assembleRawOps,
  bulkUploaderResponseHandler,
  createUpdateRequest,
  sendUpdateRequest
} from '../shared'
import { AudienceSettings } from '../generated-types'
import { UpdateHandlerPayload } from '../types'
import { UpdateUsersDataResponse, ErrorCode, ErrorInfo } from '../proto/protofile'
import { StatsContext, Response } from '@segment/actions-core'
import createRequestClient from '../../../../../core/src/create-request-client'

const oneMockPayload: UpdateHandlerPayload = {
  external_audience_id: 'products/DISPLAY_VIDEO_ADVERTISER/customers/123/userLists/456',
  google_gid: 'CAESEHIV8HXNp0pFdHgi2rElMfk',
  mobile_advertising_id: '3b6e47b3-1437-4ba2-b3c9-446e4d0cd1e5',
  partner_provided_id: 'my-anon-id-42',
  enable_batching: true
}

const mockRequestClient = createRequestClient()

const manyMockPayloads: UpdateHandlerPayload[] = [
  oneMockPayload,
  {
    external_audience_id: 'products/DISPLAY_VIDEO_ADVERTISER/customers/123/userLists/456',
    partner_provided_id: 'my-anon-id-43',
    enable_batching: true
  },
  {
    external_audience_id: 'products/DISPLAY_VIDEO_ADVERTISER/customers/123/userLists/456',
    google_gid: 'XNp0pFdHgi2rElMfk',
    enable_batching: true
  }
]

const mockStatsClient = {
  incr: jest.fn(),
  observe: jest.fn(),
  _name: jest.fn(),
  _tags: jest.fn(),
  histogram: jest.fn(),
  set: jest.fn()
}

const mockStatsContext = {
  statsClient: mockStatsClient,
  tags: []
} as StatsContext

const getRandomError = () => {
  // possible errors for this stage are BAD_DATA, BAD_COOKIE, BAD_ATTRIBUTE_ID, BAD_NETWORK_ID.
  const random = Math.floor(Math.random() * 4)
  switch (random) {
    case 0:
      return ErrorCode.BAD_DATA
    case 1:
      return ErrorCode.BAD_COOKIE
    case 2:
      return ErrorCode.BAD_ATTRIBUTE_ID
    case 3:
      return ErrorCode.BAD_NETWORK_ID
  }
}

// Mock only the error code. The contents of the response are not important.
const createMockResponse = (errorCode: ErrorCode, payload: UpdateHandlerPayload[]) => {
  const responseHandler = new UpdateUsersDataResponse()
  responseHandler.status = errorCode

  if (errorCode === ErrorCode.PARTIAL_SUCCESS) {
    // Making assumptions about IdType and UserId here because
    // we are not currently testing their content therefore, it doesn't matter.

    responseHandler.errors = payload.map((p) => {
      const errorInfo = new ErrorInfo()
      errorInfo.errorCode = getRandomError()
      errorInfo.userListId = BigInt(p.external_audience_id.split('/').pop() || '-1')
      errorInfo.userIdType = 0
      errorInfo.userId = p.google_gid || p.mobile_advertising_id || p.partner_provided_id || ''
      return errorInfo
    })
  }

  const b = Buffer.from(responseHandler.toBinary())
  const arrayBuffer = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)

  return new Response(arrayBuffer, { status: errorCode === ErrorCode.NO_ERROR ? 200 : 400 })
}

describe('shared', () => {
  describe('buildHeaders', () => {
    it('should build headers correctly', () => {
      const accessToken = 'real-token'
      const audienceSettings: AudienceSettings = {
        advertiserId: '123',
        accountType: 'DISPLAY_VIDEO_ADVERTISER'
      }

      const result = buildHeaders(audienceSettings, accessToken)
      expect(result).toEqual({
        Authorization: 'Bearer real-token',
        'Content-Type': 'application/json',
        'Login-Customer-Id': 'products/DATA_PARTNER/customers/1663649500',
        'Linked-Customer-Id': 'products/DISPLAY_VIDEO_ADVERTISER/customers/123'
      })
    })
  })

  describe('assembleRawOps', () => {
    it('should return an array of UserOperation objects with IDFA', () => {
      const results = assembleRawOps(oneMockPayload, 'add')
      expect(results).toEqual([
        {
          UserId: 'CAESEHIV8HXNp0pFdHgi2rElMfk',
          UserIdType: 0,
          UserListId: 456,
          Delete: false
        },
        {
          UserId: '3b6e47b3-1437-4ba2-b3c9-446e4d0cd1e5',
          UserIdType: 1,
          UserListId: 456,
          Delete: false
        },
        {
          UserId: 'my-anon-id-42',
          UserIdType: 4,
          UserListId: 456,
          Delete: false
        }
      ])
    })

    it('should return an array of UserOperation objects with Android Advertising ID', () => {
      oneMockPayload.mobile_advertising_id = '3b6e47b314374ba2b3c9446e4d0cd1e5'

      const results = assembleRawOps(oneMockPayload, 'remove')
      expect(results).toEqual([
        {
          UserId: 'CAESEHIV8HXNp0pFdHgi2rElMfk',
          UserIdType: 0,
          UserListId: 456,
          Delete: true
        },
        {
          UserId: '3b6e47b314374ba2b3c9446e4d0cd1e5',
          UserIdType: 2,
          UserListId: 456,
          Delete: true
        },
        {
          UserId: 'my-anon-id-42',
          UserIdType: 4,
          UserListId: 456,
          Delete: true
        }
      ])
    })
  })

  // This method is used for both success and error cases.
  // The easiest way to tell if something worked is to check the calls to statsClient
  // The assumptions made around the payload are based on the error codes described in the proto file.
  describe('bulkUploaderResponseHandler', () => {
    it('handles success', async () => {
      const mockResponse: Response = createMockResponse(ErrorCode.NO_ERROR, manyMockPayloads)
      const statsName = 'addToAudience'

      await bulkUploaderResponseHandler(mockResponse, statsName, mockStatsContext)
      expect(mockStatsClient.incr).toHaveBeenCalledWith(`${statsName}.success`, 1, mockStatsContext.tags)
    })

    it('handles 400 error', async () => {
      const mockResponse: Response = createMockResponse(ErrorCode.BAD_COOKIE, manyMockPayloads)
      const statsName = 'addToAudience'

      await bulkUploaderResponseHandler(mockResponse, statsName, mockStatsContext)
      expect(mockStatsClient.incr).toHaveBeenCalledWith(`${statsName}.error.BAD_COOKIE`, 1, mockStatsContext.tags)
    })

    it('handles 500 error', async () => {
      const mockResponse: Response = createMockResponse(ErrorCode.INTERNAL_ERROR, manyMockPayloads)
      const statsName = 'removeFromAudience'

      await expect(bulkUploaderResponseHandler(mockResponse, statsName, mockStatsContext)).rejects.toThrow(
        'Bulk Uploader Internal Error'
      )

      expect(mockStatsClient.incr).toHaveBeenCalledWith(`${statsName}.error.INTERNAL_ERROR`, 1, mockStatsContext.tags)
    })
  })

  // If the request is invalid, its serialization will throw an error.
  // No need to test the contents of the object because that is covered in assembleRawOps.
  describe('createUpdateRequest', () => {
    it('should create an UpdateUsersDataRequest object with the correct number of operations', () => {
      const r = createUpdateRequest(manyMockPayloads, 'add')
      expect(r.ops.length).toEqual(5)
    })

    it('should throw an error when unable to create UpdateUsersDataRequest', () => {
      const mockPayload = {
        enable_batching: true
      } as UpdateHandlerPayload
      expect(() => createUpdateRequest([mockPayload], 'remove')).toThrowError()
    })
  })

  // Not testing payload content here because it's covered by the bulkUploaderResponseHandler.
  // Attempting to assemble a valid response payload is not worth the effort.
  describe('sendUpdateRequest', () => {
    it('should succeed', async () => {
      nock('https://cm.g.doubleclick.net').post('/upload?nid=segment').reply(200)

      const r = createUpdateRequest(manyMockPayloads, 'add')
      await sendUpdateRequest(mockRequestClient, r, 'addToAudience', mockStatsContext)
      expect(mockStatsClient.incr).toHaveBeenCalledWith('addToAudience.success', 1, mockStatsContext.tags)
    })

    // To gracefully fails means that the request was successful, but some of the operations failed.
    // The response will contain a list of errors. Its content is unknown.
    // The endpoint will return a 400 status code.
    it('should gracefully fail', async () => {
      nock('https://cm.g.doubleclick.net').post('/upload?nid=segment').reply(400)

      UpdateUsersDataResponse.prototype.fromBinary = jest.fn(() => {
        const responseHandler = new UpdateUsersDataResponse()
        responseHandler.status = ErrorCode.PARTIAL_SUCCESS
        responseHandler.errors = [
          {
            errorCode: ErrorCode.BAD_DATA,
            userListId: BigInt(456),
            userIdType: 0,
            userId: 'CAESEHIV8HXNp0pFdHgi2rElMfk'
          } as ErrorInfo
        ]
        return responseHandler
      })

      const r = createUpdateRequest(manyMockPayloads, 'add')
      await sendUpdateRequest(mockRequestClient, r, 'addToAudience', mockStatsContext)
      expect(mockStatsClient.incr).toHaveBeenCalledWith('addToAudience.error.PARTIAL_SUCCESS', 1, mockStatsContext.tags)
    })

    it('should abruptly fail', async () => {
      nock('https://cm.g.doubleclick.net').post('/upload?nid=segment').reply(500)

      const r = createUpdateRequest(manyMockPayloads, 'add')
      await expect(sendUpdateRequest(mockRequestClient, r, 'addToAudience', mockStatsContext)).rejects.toThrow()
    })
  })
})
