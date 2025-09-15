import nock from 'nock'
import { hashEmail, prepareListItems, preparePayload, sendDataToMicrosoftBingAds, handleHttpError } from '../utils'
import { BASE_URL } from '../constants'
import { MultiStatusResponse, HTTPError, RequestClient } from '@segment/actions-core'
import { syncAudiencePayload } from '../types'
import { Payload } from '../syncAudiences/generated-types'

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

describe('prepareListItems', () => {
  it('adds hashed emails when identifierType is Email', () => {
    const msResponse = createMockMsResponse()
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'Email',
        operation: 'Add',
        email: 'test@example.com',
        enable_batching: true,
        batch_size: 1000
      }
    ]
    const result = prepareListItems(payload, 'Email', msResponse)
    expect(result.size).toBe(1)
    const [key] = Array.from(result.keys())
    expect(key).toHaveLength(64)
  })

  it('sets error when email missing for Email identifierType', () => {
    const msResponse = createMockMsResponse()
    const payload: Payload[] = [
      { audience_id: 'a1', identifier_type: 'Email', operation: 'Add', enable_batching: true, batch_size: 1000 }
    ]
    const result = prepareListItems(payload, 'Email', msResponse)
    expect(result.size).toBe(0)
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 400,
        errormessage: expect.stringContaining('Email is required')
      })
    )
  })

  it('uses crm_id when identifierType is CRM', () => {
    const msResponse = createMockMsResponse()
    const payload: Payload[] = [
      {
        audience_id: 'a1',
        identifier_type: 'CRM',
        operation: 'Add',
        crm_id: '12345',
        enable_batching: true,
        batch_size: 1000
      }
    ]
    const result = prepareListItems(payload, 'CRM', msResponse)
    expect(result.get('12345')).toBe(0)
  })

  it('sets error when crm_id missing for CRM identifierType', () => {
    const msResponse = createMockMsResponse()
    const payload: Payload[] = [
      { audience_id: 'a1', identifier_type: 'CRM', operation: 'Add', enable_batching: true, batch_size: 1000 }
    ]
    const result = prepareListItems(payload, 'CRM', msResponse)
    expect(result.size).toBe(0)
    expect(msResponse.setErrorResponseAtIndex).toHaveBeenCalledWith(
      0,
      expect.objectContaining({
        status: 400,
        errormessage: expect.stringContaining('CRM ID is required')
      })
    )
  })
})

describe('preparePayload', () => {
  it('formats payload correctly', () => {
    const result: syncAudiencePayload = preparePayload('aud_1', 'Add', 'Email', ['abc'])
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

    const payload = { foo: 'bar' } as unknown as syncAudiencePayload
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
        operation: 'Add',
        email: 'foo@bar.com',
        enable_batching: true,
        batch_size: 1000
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
