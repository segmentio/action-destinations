import { JSONSchema4 } from 'json-schema'
import { removeEmptyValues } from '../remove-empty-values'

describe(removeEmptyValues.name, () => {
  it('removes empty strings when the schema type doesnt match', () => {
    const input = {
      foo: '',
      bar: '1',
      baz: true
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' },
        baz: { type: 'boolean' }
      }
    }

    expect(removeEmptyValues(input, schema)).toMatchObject({
      bar: '1',
      baz: true
    })
  })

  it('leaves empty objects, because we cannot know if they are acceptable', () => {
    const input = {
      foo: {},
      bar: '1'
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        foo: { type: 'object' },
        bar: { type: 'string' }
      }
    }

    expect(removeEmptyValues(input, schema)).toMatchObject({
      foo: {},
      bar: '1'
    })
  })

  it('removes missing values from nested fields', () => {
    const input = {
      a: {
        b: '',
        c: null
      }
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        a: {
          type: 'object',
          properties: {
            b: { type: 'string' },
            c: { type: 'null' }
          }
        }
      }
    }

    expect(removeEmptyValues(input, schema)).toMatchObject({
      a: {
        c: null
      }
    })
  })

  it('removes null when it is not explicitly accepted', () => {
    const input = {
      a: null,
      b: '1'
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'string' }
      }
    }

    expect(removeEmptyValues(input, schema)).toMatchObject({
      b: '1'
    })
  })

  it('leaves null when it is explicitly accepted', () => {
    const input = {
      a: null,
      b: '1'
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        a: { type: ['string', 'null'] },
        b: { type: 'string' }
      }
    }

    expect(removeEmptyValues(input, schema)).toMatchObject({
      a: null,
      b: '1'
    })
  })
})
