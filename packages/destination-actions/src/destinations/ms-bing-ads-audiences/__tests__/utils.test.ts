import nock from 'nock'
import {
  hashEmail,
  preparePayload,
  sendDataToMicrosoftBingAds,
  handleHttpError,
  handleMultistatusResponse
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
    const listItemsMap = new Map<string, number>([['abc', 0]])
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
        json: async () => ({ status: 500, message: 'Server exploded' })
      }
    }

    await handleHttpError(msResponse, error as HTTPError, listItemsMap, payload)
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 500,
        errormessage: 'Server exploded'
      })
    )
  })
})

describe('handleMultistatusResponse', () => {
  it('throws IntegrationError when not in batch mode and there are partial errors', () => {
    const msResponse = createMockMsResponse()
    const items = ['item1']
    const listItemsMap = new Map<string, number>([['item1', 0]])
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
    const listItemsMap = new Map<string, number>([
      ['item1', 0],
      ['item2', 1],
      ['item3', 2]
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
    const listItemsMap = new Map<string, number>([
      ['item1', 0],
      ['item2', 1]
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
    const listItemsMap = new Map<string, number>([['item1', 0]])
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
})
