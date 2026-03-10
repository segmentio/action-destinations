import { parseTrackApiErrors, parseTrackApiMultiStatusResponse, resolveIdentifiers, sendBatch } from '../utils'

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
  it('should parse 207 multi-status responses from the Track API', async () => {
    const request = async () => ({
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

    const response = await sendBatch(request as never, [
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

    expect(response).toBeDefined()
    expect((response as { length: number }).length).toBe(2)
    expect((response as { getResponseAtIndex(index: number): unknown }).getResponseAtIndex(0)).toEqual({
      status: 200,
      body: {},
      sent: {}
    })
    expect((response as { getResponseAtIndex(index: number): unknown }).getResponseAtIndex(1)).toEqual({
      status: 400,
      errormessage: 'Attribute value too long',
      errortype: 'PAYLOAD_VALIDATION_FAILED',
      errorreporter: 'DESTINATION'
    })
  })
})

describe('parseTrackApiErrors', () => {
  it('should fill success entries for batch items without errors', () => {
    const results = parseTrackApiErrors(
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

    expect(results).toEqual([
      { status: 200, body: {}, sent: {} },
      {
        status: 400,
        errormessage: 'Name is required',
        errortype: 'PAYLOAD_VALIDATION_FAILED',
        errorreporter: 'DESTINATION'
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
