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
        foo: { type: 'number' },
        bar: { type: 'string' },
        baz: { type: 'boolean' }
      }
    }

    expect(removeEmptyValues(input, schema, true)).toEqual({
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

    expect(removeEmptyValues(input, schema, true)).toEqual({
      foo: {},
      bar: '1'
    })
  })

  it('removes missing values from nested fields when their schema type is defined', () => {
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
            b: { type: 'number' },
            c: { type: 'null' }
          }
        }
      }
    }

    expect(removeEmptyValues(input, schema, true)).toEqual({
      a: {
        c: null
      }
    })
  })

  it('leaves nested properties as-is when the schema type is not defined', () => {
    const input = {
      data: {
        context: {
          search: ''
        }
      }
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        data: {
          type: 'object'
        }
      }
    }

    expect(removeEmptyValues(input, schema, true)).toEqual({
      data: {
        context: {
          search: ''
        }
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

    expect(removeEmptyValues(input, schema, true)).toEqual({
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

    expect(removeEmptyValues(input, schema, true)).toEqual({
      a: null,
      b: '1'
    })
  })

  it('removes empty strings at the field level', () => {
    const input = {
      foo: '',
      bar: '1'
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        foo: { type: 'string' },
        bar: { type: 'string' }
      }
    }

    expect(removeEmptyValues(input, schema, true)).toEqual({
      bar: '1'
    })
  })

  it('leaves empty strings when subproperties of a field', () => {
    const input = {
      product: {
        product_id: '',
        name: ''
      }
    }

    const schema: JSONSchema4 = {
      type: 'object',
      properties: {
        product: {
          type: 'object',
          properties: {
            product_id: { type: 'string' },
            name: { type: ['null', 'string'] }
          }
        }
      }
    }

    expect(removeEmptyValues(input, schema, true)).toEqual({
      product: {
        product_id: '',
        name: ''
      }
    })
  })
})
