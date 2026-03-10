import { MultiStatusResponse } from '@segment/actions-core'
import { isIsoDate, parseTrackApiErrors, parseTrackApiMultiStatusResponse, resolveIdentifiers, sendBatch } from '../utils'

describe('isIsoDate', () => {
  it('should return true for valid ISO date with fractional seconds from 1-9 digits', () => {
    expect(isIsoDate('2023-12-25T14:30:45.1')).toBe(true) // 1 digit
    expect(isIsoDate('2023-12-25T14:30:45.12')).toBe(true) // 2 digits
    expect(isIsoDate('2023-12-25T14:30:45.123')).toBe(true) // 3 digits
    expect(isIsoDate('2023-12-25T14:30:45.1234')).toBe(true) // 4 digits
    expect(isIsoDate('2023-12-25T14:30:45.12345')).toBe(true) // 5 digits
    expect(isIsoDate('2023-12-25T14:30:45.123456')).toBe(true) // 6 digits
    expect(isIsoDate('2023-12-25T14:30:45.1234567')).toBe(true) // 7 digits
    expect(isIsoDate('2023-12-25T14:30:45.12345678')).toBe(true) // 8 digits
    expect(isIsoDate('2023-12-25T14:30:45.123456789')).toBe(true) // 9 digits
  })

  it('should return true for valid ISO date with fractional seconds and timezone', () => {
    expect(isIsoDate('2023-12-25T14:30:45.123Z')).toBe(true) // UTC
    expect(isIsoDate('2023-12-25T14:30:45.123456+05:30')).toBe(true) // timezone offset
    expect(isIsoDate('2023-12-25T14:30:45.123456789-08:00')).toBe(true) // negative timezone
  })

  it('should return true for valid ISO date without fractional seconds', () => {
    expect(isIsoDate('2023-12-25T14:30:45')).toBe(true)
    expect(isIsoDate('2023-12-25T14:30:45Z')).toBe(true)
    expect(isIsoDate('2023-12-25')).toBe(true) // date only
  })

  it('should return false for invalid fractional seconds i.e more than 9 digits', () => {
    expect(isIsoDate('2023-12-25T14:30:45.1234567890')).toBe(false) // 10 digits
    expect(isIsoDate('2023-12-25T14:30:45.12345678901')).toBe(false) // 11 digits
  })

  it('should return false for invalid date formats', () => {
    expect(isIsoDate('invalid-date')).toBe(false)
    expect(isIsoDate('2023-13-25')).toBe(false) // invalid month
    expect(isIsoDate('2023-12-32')).toBe(false) // invalid day
    expect(isIsoDate('2023-12-25T25:30:45')).toBe(false) // invalid hour
  })
})

describe('resolveIdentifiers', () => {
  it('should return object_id and object_type_id if both are provided', () => {
    const identifiers = { object_id: '123', object_type_id: '456' }

    expect(resolveIdentifiers(identifiers)).toEqual(identifiers)
  })

  it('should return cio_id if person_id starts with "cio_"', () => {
    const identifiers = { person_id: 'cio_123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ cio_id: '123' })
  })

  it('should return email if person_id is a valid email', () => {
    const identifiers = { person_id: 'test@example.com' }

    expect(resolveIdentifiers(identifiers)).toEqual({ email: 'test@example.com' })
  })

  it('should return id if person_id is provided', () => {
    const identifiers = { person_id: '123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ id: '123' })
  })

  it('should return email if email is provided', () => {
    const identifiers = { email: 'test@example.com' }

    expect(resolveIdentifiers(identifiers)).toEqual({ email: 'test@example.com' })
  })

  it('should return anonymous_id if anonymous_id is provided', () => {
    const identifiers = { anonymous_id: '123' }

    expect(resolveIdentifiers(identifiers)).toEqual({ anonymous_id: '123' })
  })

  it('should return undefined if no identifiers are provided', () => {
    expect(resolveIdentifiers({})).toBeUndefined()
  })
})

describe('sendBatch', () => {
  it('should parse 207 multi-status Track API responses', async () => {
    const request = jest.fn().mockResolvedValue({
      status: 207,
      data: {
        errors: [
          {
            batch_index: 1,
            reason: 'invalid',
            message: 'Attribute value too long'
          }
        ]
      }
    })

    const response = await sendBatch(request, [
      {
        type: 'person',
        action: 'event',
        settings: {},
        payload: { person_id: 'user-1', name: 'First' }
      },
      {
        type: 'person',
        action: 'event',
        settings: {},
        payload: { person_id: 'user-2', name: 'Second' }
      }
    ])

    expect(response).toBeInstanceOf(MultiStatusResponse)
    expect((response as MultiStatusResponse).length()).toBe(2)
    expect((response as MultiStatusResponse).getResponseAtIndex(0).value()).toEqual({
      status: 200,
      body: {},
      sent: {}
    })
    expect((response as MultiStatusResponse).getResponseAtIndex(1).value()).toEqual({
      status: 400,
      errormessage: 'Attribute value too long',
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      body: {
        batch_index: 1,
        reason: 'invalid',
        message: 'Attribute value too long'
      }
    })
  })

  it('should parse 200 Track API responses that still contain batch errors', async () => {
    const request = jest.fn().mockResolvedValue({
      status: 200,
      data: {
        errors: [
          {
            batch_index: 0,
            reason: 'required',
            field: 'name',
            message: 'Name is required'
          }
        ]
      }
    })

    const response = await sendBatch(request, [
      {
        type: 'person',
        action: 'event',
        settings: {},
        payload: { person_id: 'user-1', name: 'First' }
      }
    ])

    expect(response).toBeInstanceOf(MultiStatusResponse)
    expect((response as MultiStatusResponse).getResponseAtIndex(0).value()).toEqual({
      status: 400,
      errormessage: 'Name is required',
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      body: {
        batch_index: 0,
        reason: 'required',
        field: 'name',
        message: 'Name is required'
      }
    })
  })
})

describe('parseTrackApiErrors', () => {
  it('should fill success entries for items without errors', () => {
    const response = parseTrackApiErrors(
      [
        {
          batch_index: 1,
          reason: 'required',
          field: 'name',
          message: 'Name is required'
        }
      ],
      3
    )

    expect(response.getAllResponses().map((result) => result.value())).toEqual([
      { status: 200, body: {}, sent: {} },
      {
        status: 400,
        errormessage: 'Name is required',
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        body: {
          batch_index: 1,
          reason: 'required',
          field: 'name',
          message: 'Name is required'
        }
      },
      { status: 200, body: {}, sent: {} }
    ])
  })
})

describe('parseTrackApiMultiStatusResponse', () => {
  it('should return null for non-Track API response bodies', () => {
    expect(parseTrackApiMultiStatusResponse({ ok: true }, 1)).toBeNull()
  })
})
