import { COPY, DROP, EventMap, mapEvent } from '../mapEvent'
import { IntegrationError } from '@segment/actions-core'

describe('mapEvent', () => {
  const sField = 'string'
  const nField = 114
  const oField = { a: 'apple', pi: 3.14 }
  const unmappedField = 'unmapped'

  test('simple', () => {
    expect(
      mapEvent(
        {
          fields: {
            sField: DROP,
            nField: COPY,
            oField: COPY
          }
        },
        { sField, nField, oField, unmappedField }
      )
    ).toEqual({
      nField,
      oField
    })
  })

  test('unmapped fields', () => {
    expect(
      mapEvent({ fields: {}, unmappedFieldObject: 'unmapped' }, { sField, nField, oField, unmappedField })
    ).toEqual({
      unmapped: {
        sField,
        nField: nField.toString(),
        oField: JSON.stringify(oField),
        unmappedField
      }
    })

    expect(
      mapEvent(
        {
          fields: {
            sField: COPY,
            oField: DROP
          },
          unmappedFieldObject: 'unmapped'
        },
        { sField, nField, oField }
      )
    ).toEqual({
      sField,
      unmapped: { nField: nField.toString() }
    })
  })

  test('defaultObject', () => {
    const testMap: EventMap = {
      fields: {
        sField: COPY
      },
      defaultObject: {
        sField: 'default sField'
      }
    }

    expect(mapEvent(testMap, {})).toEqual({ sField: 'default sField' })
    expect(mapEvent(testMap, { sField })).toEqual({ sField })
  })

  test('friendbuyAttributes', () => {
    const testMap = {
      fields: {
        sField: COPY
      }
    }

    // friendbuyAttributes copied to root.
    expect(mapEvent(testMap, { friendbuyAttributes: { sField } })).toEqual({ sField })
    // friendbuyAttributes do not override existing root fields.
    expect(mapEvent(testMap, { sField: '1', friendbuyAttributes: { sField: '2' } })).toEqual({ sField: '1' })
  })

  test('nested objects', () => {
    const testMap: EventMap = {
      fields: {
        a: { type: 'object', fields: { sField: COPY } },
        b: { type: 'object', fields: { nField: COPY }, unmappedFieldObject: 'unmapped' }
      }
    }

    expect(
      mapEvent(testMap, {
        a: { sField, nField },
        b: { sField, nField },
        oField
      })
    ).toEqual({
      a: { sField },
      b: { nField, unmapped: { sField } }
    })
  })

  test('arrays and nested arrays', () => {
    const testMap: EventMap = {
      fields: {
        a: { type: 'array' },
        b: {
          type: 'array',
          defaultObject: { x: '-x-', y: '-y-' },
          fields: { x: COPY, y: COPY, z: DROP },
          unmappedFieldObject: 'unmapped'
        }
      }
    }

    expect(
      mapEvent(testMap, {
        a: [1, 2, 3],
        b: [{ w: 'whiskey', x: 'x-ray', y: 'yankee', z: 'zulu' }, { y: 'yes' }],
        c: 'cat'
      })
    ).toEqual({
      a: [1, 2, 3],
      b: [
        { x: 'x-ray', y: 'yankee', unmapped: { w: 'whiskey' } },
        { x: '-x-', y: 'yes' }
      ]
    })
  })

  test('finalize', () => {
    const testMap: EventMap = {
      fields: { a: { type: 'array' } },
      finalize: (o: any) => {
        o.total = (o.a || []).reduce((a: any, b: any) => a + b, 0)
        return o
      }
    }

    expect(mapEvent(testMap, { a: [1, 2, 3] })).toEqual({ a: [1, 2, 3], total: 6 })
  })

  test('convert', () => {
    const testMap: EventMap = {
      fields: { a: { convert: (a: any) => (typeof a === 'string' ? a.split(',') : a) } }
    }

    expect(mapEvent(testMap, { a: 'one,two,three' })).toEqual({ a: ['one', 'two', 'three'] })
    expect(mapEvent(testMap, { a: ['one', 'two'] })).toEqual({ a: ['one', 'two'] })
  })

  test('no mapped fields', () => {
    const testMap: EventMap = {
      fields: { a: COPY }
    }

    expect(() => mapEvent(testMap, { unmapped1: 'some value', unmapped2: ' another value' })).toThrow(IntegrationError)
  })
})
