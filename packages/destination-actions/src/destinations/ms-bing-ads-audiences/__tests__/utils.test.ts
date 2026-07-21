import nock from 'nock'
import {
  hashEmail,
  preparePayload,
  sendDataToMicrosoftBingAds,
  handleHttpError,
  handleMultistatusResponse,
  categorizePayloadByAction,
  parseBingFault,
  inspectAuthError,
  formatBingErrorBody
} from '../utils'
import { BASE_URL } from '../constants'
import { MultiStatusResponse, HTTPError, RequestClient, IntegrationError } from '@segment/actions-core'
import { Payload } from '../syncAudiences/generated-types'
import { SyncAudiencePayload } from '../types'
import { ModifiedResponse } from '@segment/actions-core/*'

const createMockMsResponse = (): MultiStatusResponse & { getResponses: () => any[] } => {
  const responses: any[] = []
  return {
    setErrorResponseAtIndex: jest.fn((index: number, res: any) => {
      responses[index] = res
    }),
    setSuccessResponseAtIndex: jest.fn((index: number, res: any) => {
      responses[index] = res
    }),
    getResponses: () => responses
  } as unknown as MultiStatusResponse & { getResponses: () => any[] }
}

describe('hashEmail', () => {
  it('normalizes and hashes email correctly', () => {
    const hashed = hashEmail('  Demo@Example.com ')
    expect(typeof hashed).toBe('string')
    expect(hashed).toHaveLength(64) // sha256 hex
  })
})

describe('preparePayload', () => {
  it('formats payload correctly', () => {
    const result: SyncAudiencePayload = preparePayload('aud_1', 'Add', 'Email', ['abc'])
    expect(result).toEqual({
      CustomerListUserData: {
        ActionType: 'Add',
        AudienceId: 'aud_1',
        CustomerListItemSubType: 'Email',
        CustomerListItems: ['abc']
      }
    })
  })
})

describe('categorizePayloadByAction', () => {
  it('handles duplicate identifiers correctly', () => {
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: { a1: true },
        audience_key: 'a1',
        computation_class: 'Default'
      },
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com', // Same email as first payload
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: { a1: true },
        audience_key: 'a1',
        computation_class: 'Default'
      },
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'other@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const addMap: Map<string, number[]> = new Map()
    const removeMap: Map<string, number[]> = new Map()

    categorizePayloadByAction(payload, addMap, removeMap)

    const hashedEmail = hashEmail('test@example.com')
    const hashedOtherEmail = hashEmail('other@example.com')

    expect(addMap.get(hashedEmail)).toEqual([0, 1])

    // Check that the remove map contains the index for the other email
    expect(removeMap.get(hashedOtherEmail)).toEqual([2])
  })
})

describe('sendDataToMicrosoftBingAds', () => {
  it('sends data to Microsoft Bing Ads', async () => {
    nock(BASE_URL).post('/CustomerListUserData/Apply', { foo: 'bar' }).reply(200, { ok: true })

    const mockRequest = async (_url: string) => {
      return { ok: true }
    }

    const payload = { foo: 'bar' } as unknown as SyncAudiencePayload
    const response = await sendDataToMicrosoftBingAds(mockRequest as RequestClient, payload)
    expect(response).toEqual({ ok: true })
  })
})

describe('handleHttpError', () => {
  it('sets error responses for all items', async () => {
    const msResponse = createMockMsResponse()
    const listItemsMap = new Map<string, number[]>([['abc', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'foo@bar.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const error: Partial<HTTPError> = {
      // @ts-ignore - status is read from the HTTP response; body carries Bing's AdApiFaultDetail.
      response: {
        status: 500,
        content: JSON.stringify({
          Errors: [{ Code: 0, ErrorCode: 'InternalError', Message: 'Server exploded' }],
          TrackingId: 'track-500'
        })
      }
    }

    await handleHttpError(msResponse, error as HTTPError, listItemsMap, payload)
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 500,
        errormessage: 'InternalError (0): Server exploded'
      })
    )
  })

  it('normalizes an expired-token 401 (code 109) so the framework refreshes the token', async () => {
    const msResponse = createMockMsResponse()
    const listItemsMap = new Map<string, number[]>([['abc', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'foo@bar.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const error: Partial<HTTPError> = {
      // @ts-ignore
      response: {
        status: 401,
        content: JSON.stringify({
          Errors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'expired' }],
          TrackingId: 'track-109'
        })
      }
    }

    await handleHttpError(msResponse, error as HTTPError, listItemsMap, payload)
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(0, expect.objectContaining({ status: 401 }))
  })

  it('normalizes to 401 even when a large body would truncate (parses response.data, not truncated text)', async () => {
    const msResponse = createMockMsResponse()
    const listItemsMap = new Map<string, number[]>([['abc', [0]]])
    const payload = [{ audience_id: 'a1' }] as unknown as Payload[]
    // A >2048 char body would break JSON.parse of the truncated string; parsing response.data avoids that.
    const fault = {
      Errors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'x'.repeat(5000) }],
      TrackingId: 'track-big'
    }
    const error: Partial<HTTPError> = {
      // @ts-ignore - `data` is what the request client populates (untruncated).
      response: { status: 500, data: fault, content: JSON.stringify(fault) }
    }
    await handleHttpError(msResponse, error as HTTPError, listItemsMap, payload)
    // status 500 from HTTP, but code 109 forces 401 so the framework refreshes the token.
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(0, expect.objectContaining({ status: 401 }))
  })
})

describe('parseBingFault', () => {
  it('finds a refreshable auth code even when it is not the first error', () => {
    const fault = {
      Errors: [
        { Code: 117, ErrorCode: 'CallRateExceeded', Message: 'slow down' },
        { Code: 109, ErrorCode: 'AuthenticationTokenExpired', Message: 'expired' }
      ]
    }
    expect(parseBingFault(fault, 500, 'err').status).toBe(401)
  })

  it('coerces a string Code from JSON', () => {
    const fault = { Errors: [{ Code: '109' as unknown as number, ErrorCode: 'AuthenticationTokenExpired' }] }
    expect(parseBingFault(fault, 500, 'err').status).toBe(401)
  })

  it('omits the code segment from the message when Code is missing', () => {
    const fault = { Errors: [{ ErrorCode: 'SomeError', Message: 'boom' }] }
    expect(parseBingFault(fault, 400, 'err').errormessage).toBe('SomeError: boom')
  })
})

describe('inspectAuthError', () => {
  it('is refreshable for an expired-token fault returned as HTTP 500', () => {
    const error = {
      response: { status: 500, data: { Errors: [{ Code: 109, ErrorCode: 'AuthenticationTokenExpired' }] } }
    } as unknown as HTTPError
    expect(inspectAuthError(error).refreshable).toBe(true)
  })

  it('is NOT refreshable for a non-auth error', () => {
    const error = {
      response: { status: 429, data: { Errors: [{ Code: 117, ErrorCode: 'CallRateExceeded' }] } }
    } as unknown as HTTPError
    expect(inspectAuthError(error).refreshable).toBe(false)
  })

  it('is NOT refreshable for a bare 401 with no auth code (e.g. 106 no-access) — must not masquerade as a token problem', () => {
    const error = {
      response: { status: 401, data: { Errors: [{ Code: 106, ErrorCode: 'UserIsNotAuthorized' }] } }
    } as unknown as HTTPError
    expect(inspectAuthError(error).refreshable).toBe(false)
  })
})

describe('formatBingErrorBody', () => {
  it('does not echo raw text when the body is unparseable (PII safety)', () => {
    expect(formatBingErrorBody('crm_secret_12345 not json')).toBe('unparseable response body')
  })

  it('summarizes ErrorCode/Message/TrackingId from a known fault', () => {
    const body = JSON.stringify({ Errors: [{ ErrorCode: 'AuthenticationTokenExpired', Message: 'expired' }], TrackingId: 't1' })
    expect(formatBingErrorBody(body)).toBe('AuthenticationTokenExpired: expired; TrackingId: t1')
  })
})

describe('handleMultistatusResponse', () => {
  it('uses default Code (400) when error.Code is missing', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1']
    const listItemsMap = new Map<string, number[]>([['item1', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            ErrorCode: 'InvalidInput',
            Message: 'The input is invalid',
            Code: undefined, // Missing Code
            Details: null,
            Index: 0,
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    handleMultistatusResponse(msResponse, response as unknown as ModifiedResponse, items, listItemsMap, payload, true)

    // Should use default 400 status code
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 400, // Default value
        errormessage: 'InvalidInput: The input is invalid'
      })
    )
  })

  it('throws IntegrationError when not in batch mode and there are partial errors', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1']
    const listItemsMap = new Map<string, number[]>([['item1', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: false,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            ErrorCode: 'InvalidInput',
            Message: 'The input is invalid',
            Code: 400,
            Details: null,
            Index: 0,
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    expect(() => {
      handleMultistatusResponse(
        msResponse,
        response as unknown as ModifiedResponse,
        items,
        listItemsMap,
        payload,
        false
      )
    }).toThrow(IntegrationError)
  })

  it('processes partial errors in batch mode', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1', 'item2', 'item3']
    const listItemsMap = new Map<string, number[]>([
      ['item1', [0]],
      ['item2', [1]],
      ['item3', [2]]
    ])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test1@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      },
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test2@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      },
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test3@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            ErrorCode: 'InvalidInput',
            Message: 'The input is invalid',
            Code: 400,
            Details: null,
            Index: 1, // This corresponds to item2
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    handleMultistatusResponse(msResponse, response as unknown as ModifiedResponse, items, listItemsMap, payload, true)

    // Check that the error item was handled correctly
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: 400,
        errormessage: 'InvalidInput: The input is invalid'
      })
    )

    // Check that successful items were marked as successful
    expect(msResponse.setSuccessResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 200
      })
    )
    expect(msResponse.setSuccessResponseAtIndex).toHaveBeenCalledWith(
      2,
      expect.objectContaining({
        status: 200
      })
    )
  })

  it('marks all items as successful when there are no partial errors', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1', 'item2']
    const listItemsMap = new Map<string, number[]>([
      ['item1', [0]],
      ['item2', [1]]
    ])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test1@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      },
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test2@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = { data: {} }

    handleMultistatusResponse(msResponse, response as any as ModifiedResponse, items, listItemsMap, payload, true)

    // Check that all items were marked as successful
    expect(msResponse.setSuccessResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 200
      })
    )
    expect(msResponse.setSuccessResponseAtIndex).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: 200
      })
    )
  })

  it('handles partial errors with invalid indices', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1']
    const listItemsMap = new Map<string, number[]>([['item1', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            ErrorCode: 'InvalidInput',
            Message: 'The input is invalid',
            Code: 400,
            Details: null,
            Index: 999, // Invalid index
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    handleMultistatusResponse(msResponse, response as any as ModifiedResponse, items, listItemsMap, payload, true)

    // Even though there's a partial error, its index is invalid, so all items should be marked successful
    expect(msResponse.setSuccessResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 200
      })
    )
  })

  it('uses default Message ("No error message provided") when Message is missing in partial errors', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1']
    const listItemsMap = new Map<string, number[]>([['item1', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            ErrorCode: 'InvalidInput',
            // Message is missing
            Code: 403,
            Details: null,
            Index: 0,
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    handleMultistatusResponse(msResponse, response as unknown as ModifiedResponse, items, listItemsMap, payload, true)

    // Check that the default Message "No error message provided" is used
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 403,
        errormessage: 'InvalidInput: No error message provided'
      })
    )
  })

  it('uses default ErrorCode ("UnknownError") when ErrorCode is missing in partial errors', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1']
    const listItemsMap = new Map<string, number[]>([['item1', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            // ErrorCode is missing
            Message: 'The input is invalid',
            Code: 403,
            Details: null,
            Index: 0,
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    handleMultistatusResponse(msResponse, response as unknown as ModifiedResponse, items, listItemsMap, payload, true)

    // Check that the default ErrorCode "UnknownError" is used
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 403,
        errormessage: 'UnknownError: The input is invalid'
      })
    )
  })

  it('uses default status code (400) when Code is missing in partial errors', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1']
    const listItemsMap = new Map<string, number[]>([['item1', [0]]])
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            ErrorCode: 'InvalidInput',
            Message: 'The input is invalid',
            // Code is missing
            Details: null,
            Index: 0,
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    handleMultistatusResponse(msResponse, response as unknown as ModifiedResponse, items, listItemsMap, payload, true)

    // Check that the default status code 400 is used
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 400, // Default value
        errormessage: 'InvalidInput: The input is invalid'
      })
    )
  })

  it('handles duplicate identifiers correctly in partial errors', () => {
    const msResponse = createMockMsResponse()
    const items = ['dupItem']
    const listItemsMap = new Map<string, number[]>([['dupItem', [0, 1]]]) // dupItem maps to two payload indices
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      },
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000,
        traits_or_props: {},
        audience_key: 'a1',
        computation_class: 'Default'
      }
    ]

    const response = {
      data: {
        PartialErrors: [
          {
            FieldPath: null,
            ErrorCode: 'InvalidInput',
            Message: 'The input is invalid',
            Code: 400,
            Details: null,
            Index: 0,
            Type: 'Error',
            ForwardCompatibilityMap: null
          }
        ]
      }
    }

    handleMultistatusResponse(msResponse, response as any as ModifiedResponse, items, listItemsMap, payload, true)

    // Check that the error item was handled correctly
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 400,
        errormessage: 'InvalidInput: The input is invalid'
      })
    )
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        status: 400,
        errormessage: 'InvalidInput: The input is invalid'
      })
    )
  })
})
