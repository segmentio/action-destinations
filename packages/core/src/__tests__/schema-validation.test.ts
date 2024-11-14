import { validateSchema } from '../schema-validation'
import { fieldsToJsonSchema } from '../destination-kit/fields-to-jsonschema'
import { InputField } from '../destination-kit/types'

const schema = fieldsToJsonSchema({
  a: {
    label: 'a',
    type: 'string'
  },
  b: {
    label: 'b',
    type: 'object'
  },
  c: {
    label: 'c',
    type: 'object',
    properties: {
      d: {
        label: 'd',
        type: 'string'
      }
    }
  },
  e: {
    label: 'e',
    type: 'boolean'
  },
  f: {
    label: 'f',
    type: 'integer'
  },
  g: {
    label: 'g',
    type: 'object',
    additionalProperties: true,
    properties: {
      h: {
        label: 'h',
        type: 'string'
      }
    }
  },
  array: {
    label: 'array',
    type: 'string',
    description: 'array',
    multiple: true
  },
  object: {
    label: 'object',
    type: 'object',
    description: 'object',
    multiple: true,
    properties: {
      key: {
        type: 'string',
        label: 'key',
        description: 'key',
        required: true
      }
    }
  }
})

describe.only('conditionally required fields', () => {
  let mockActionFields: Record<string, InputField> = {}

  beforeEach(() => {
    mockActionFields = {}
  })

  describe.only('should validate a single conditional requirement', () => {
    it('should validate b when it is required', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'a_value' }]
        }
      }

      const schema = fieldsToJsonSchema(mockActionFields)
      const b_required_mappings = [{ a: 'a_value' }, { a: 'a_value', b: 'b_value' }]

      console.log('schema', JSON.stringify(schema))

      let isValid
      isValid = validateSchema(b_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })

    it('should validate b when it is not required', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'a_value' }]
        }
      }

      const schema = fieldsToJsonSchema(mockActionFields)
      const b_not_required_mapping = [{ a: 'not value' }, { a: 'not value', b: 'b_value' }]

      let isValid
      isValid = validateSchema(b_not_required_mapping[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(b_not_required_mapping[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })
  })

  describe.only('should validate multiple conditional requirements on different fields', () => {
    it('should validate when both b and c are required', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'a_value' }]
        }
      }

      mockActionFields['c'] = {
        label: 'c',
        type: 'string',
        description: 'c',
        required: {
          // if a is not 'value', c is required
          conditions: [{ fieldKey: 'a', operator: 'is_not', value: 'value' }]
        }
      }

      const both_required_mappings = [
        { a: 'a_value' },
        { a: 'a_value', b: 'b_value' },
        { a: 'a_value', c: 'c_value' },
        { a: 'a_value', b: 'b_value', c: 'c_value' }
      ]

      const schema = fieldsToJsonSchema(mockActionFields)

      let isValid
      isValid = validateSchema(both_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(both_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(both_required_mappings[2], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(both_required_mappings[3], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })

    it('should validate when only b is required', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'a_value' }]
        }
      }

      mockActionFields['c'] = {
        label: 'c',
        type: 'string',
        description: 'c',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'value' }]
        }
      }

      const b_required_mappings = [{ a: 'a_value' }, { a: 'a_value', b: 'b_value' }]

      const schema = fieldsToJsonSchema(mockActionFields)

      let isValid
      isValid = validateSchema(b_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })

    it('should validate when only c is required', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'a_value' }]
        }
      }

      mockActionFields['c'] = {
        label: 'c',
        type: 'string',
        description: 'c',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'value' }]
        }
      }

      const c_required_mappings = [{ a: 'value' }, { a: 'value', c: 'c_value' }]

      const schema = fieldsToJsonSchema(mockActionFields)

      let isValid
      isValid = validateSchema(c_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(c_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })

    it('should validate when neither b nor c are required', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'a_value' }]
        }
      }

      mockActionFields['c'] = {
        label: 'c',
        type: 'string',
        description: 'c',
        required: {
          conditions: [{ fieldKey: 'a', operator: 'is', value: 'value' }]
        }
      }

      const neither_required_mappings = [
        { a: 'not value' },
        { a: 'not value', b: 'b_value' },
        { a: 'not value', c: 'c_value' }
      ]
      const schema = fieldsToJsonSchema(mockActionFields)

      let isValid
      isValid = validateSchema(neither_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(neither_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(neither_required_mappings[2], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })
  })

  describe.only('should handle multiple conditions on the same field', () => {
    it('should handle when one field has multiple values on another for which it is required', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          match: 'any',
          conditions: [
            { fieldKey: 'a', operator: 'is', value: 'a_value' },
            { fieldKey: 'a', operator: 'is', value: 'a_value2' }
          ]
        }
      }

      const schema = fieldsToJsonSchema(mockActionFields)

      const b_required_mappings = [
        { a: 'a_value' },
        { a: 'a_value', b: 'b_value' },
        { a: 'a_value2' },
        { a: 'a_value2', b: 'b_value' }
      ]

      const b_not_required_mapping = { a: 'b is not required' }

      let isValid
      isValid = validateSchema(b_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(b_required_mappings[2], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[3], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(b_not_required_mapping, schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })

    it('should handle when one field has multiple conditions for multiple other fields', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        required: true,
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          conditions: [
            { fieldKey: 'a', operator: 'is', value: 'a_value' },
            { fieldKey: 'c', operator: 'is', value: 'c_value' },
            { fieldKey: 'd', operator: 'is', value: 'd_value' }
          ]
        }
      }

      mockActionFields['c'] = {
        label: 'c',
        type: 'string',
        description: 'c'
      }

      mockActionFields['d'] = {
        label: 'd',
        type: 'string',
        description: 'd'
      }

      const schema = fieldsToJsonSchema(mockActionFields)

      const b_required_mappings = [
        { a: 'a_value', c: 'c_value', d: 'd_value' },
        { a: 'a_value', c: 'c_value', d: 'd_value', b: 'b_value' }
      ]

      const b_not_required_mappings = [{ a: 'a_value', c: 'c_value', d: 'd_value' }, { a: 'a' }]

      let isValid
      isValid = validateSchema(b_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(b_not_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(b_not_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })

    it('should handle when one field has multiple conditions for multiple other fields with an any matcher', async () => {
      mockActionFields['a'] = {
        label: 'a',
        type: 'string',
        description: 'a'
      }

      mockActionFields['b'] = {
        label: 'b',
        type: 'string',
        description: 'b',
        required: {
          match: 'any',
          conditions: [
            { fieldKey: 'a', operator: 'is', value: 'a_value' },
            { fieldKey: 'c', operator: 'is', value: 'c_value' },
            { fieldKey: 'd', operator: 'is', value: 'd_value' }
          ]
        }
      }

      mockActionFields['c'] = {
        label: 'c',
        type: 'string',
        description: 'c'
      }

      mockActionFields['d'] = {
        label: 'd',
        type: 'string',
        description: 'd'
      }

      mockActionFields['e'] = {
        label: 'e',
        type: 'string',
        description: 'e'
      }

      const schema = fieldsToJsonSchema(mockActionFields)

      const b_required_mappings = [
        { a: 'a_value', c: 'c_value', d: 'd_value' },
        { a: 'a_value', c: 'c_value', d: 'd_value', b: 'b_value' },
        { c: 'c_value' },
        { c: 'c_value', b: 'b_value' }
      ]

      const b_not_required_mapping = { e: 'e_value' }

      let isValid
      isValid = validateSchema(b_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(b_required_mappings[2], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[3], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)

      isValid = validateSchema(b_not_required_mapping, schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })
  })

  describe.only('should hanlde object conditions', () => {})

  describe.only('should handle different data types', () => {})
  it('should validate when multiple fields have non-overlapping conditional requirements', async () => {})

  it('should validate when multiple fields have overlapping conditional requirements', async () => {})

  it('should validate when a field is conditionally required based on the value of sync mode', async () => {})
})

describe('validateSchema', () => {
  it('should remove any keys that are not specified', () => {
    const payload = {
      nope: 'not a property'
    }

    validateSchema(payload, schema, { schemaKey: `testSchema` })

    expect(payload).not.toHaveProperty('nope')
    expect(payload).toMatchInlineSnapshot(`Object {}`)
  })

  it('should allow any properties when an object type does not specify', () => {
    const payload = {
      a: 'a',
      b: {
        anything: 'goes'
      },
      d: 'd'
    }

    validateSchema(payload, schema, { schemaKey: `testSchema` })
    expect(payload).toHaveProperty('b')
    expect(payload.b).toHaveProperty('anything')
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "a": "a",
        "b": Object {
          "anything": "goes",
        },
      }
    `)
  })

  it('should not throw when throwIfInvalid = false', () => {
    const requiredSchema = fieldsToJsonSchema({
      a: {
        label: 'a',
        type: 'string',
        required: true
      }
    })

    const payload = {}

    const isValid = validateSchema(payload, requiredSchema, { schemaKey: `testInvalid`, throwIfInvalid: false })
    expect(isValid).toBe(false)
    expect(payload).toMatchInlineSnapshot(`Object {}`)
  })

  it('should not throw when hidden = true', () => {
    const hiddenSchema = fieldsToJsonSchema({
      h: {
        label: 'h',
        type: 'string',
        unsafe_hidden: true
      }
    })

    const payload = {}

    const isValid = validateSchema(payload, hiddenSchema, { schemaKey: `testSchema` })
    expect(isValid).toBe(true)
  })

  // For now we always remove unknown keys, until builders have a way to specify the behavior
  it.todo('should not remove nested keys for valid properties')

  it('should coerce properties for more flexible but type-safe inputs', () => {
    const payload = {
      a: 1234,
      e: 'true',
      f: '123'
    }

    validateSchema(payload, schema, { schemaKey: `testSchema` })
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "a": "1234",
        "e": true,
        "f": 123,
      }
    `)
  })

  it('should coerce non-arrays into arrays', () => {
    const payload = {
      array: 'value'
    }

    validateSchema(payload, schema, { schemaKey: `testSchema` })
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "array": Array [
          "value",
        ],
      }
    `)
  })

  it('should coerce non-arrays of objects into arrays of objects', () => {
    const payload = {
      object: {
        key: 'Value'
      }
    }

    validateSchema(payload, schema, { schemaKey: `testSchema` })
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "object": Array [
          Object {
            "key": "Value",
          },
        ],
      }
    `)
  })

  it('should validate coerced arrays', () => {
    const payload = {
      object: {
        another_key: 'value2'
      }
    }

    const validated = validateSchema(payload, schema, { schemaKey: `testSchema`, throwIfInvalid: false })
    expect(validated).toBe(false)
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "object": Array [
          Object {},
        ],
      }
    `)
  })

  it('should allow any properties based on an object type additionalProperties value', () => {
    const payload = {
      a: 'a',
      b: {
        anything: 'goes'
      },
      c: {
        d: 'd',
        l: 'www'
      },
      g: {
        h: 'test',
        w: 'test 12'
      }
    }

    validateSchema(payload, schema, { schemaKey: `testSchema` })
    expect(payload).toHaveProperty('b')
    expect(payload.b).toHaveProperty('anything')
    expect(payload).toHaveProperty('c')
    expect(payload.c).toHaveProperty('d')
    expect(payload.c).not.toHaveProperty('l')
    expect(payload).toHaveProperty('g')
    expect(payload.g).toHaveProperty('h')
    expect(payload.g).toHaveProperty('w')
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "a": "a",
        "b": Object {
          "anything": "goes",
        },
        "c": Object {
          "d": "d",
        },
        "g": Object {
          "h": "test",
          "w": "test 12",
        },
      }
    `)
  })

  it('should validate min/max for number type fields', () => {
    const less_than_min_payload = { batch_size: 99 }
    const greater_than_max_payload = { batch_size: Number.MAX_SAFE_INTEGER }
    const valid_number_payload = { batch_size: 158 }

    const min_max_schema = fieldsToJsonSchema({
      batch_size: {
        type: 'number',
        label: 'Batch size',
        minimum: 100,
        maximum: 10000
      }
    })
    expect(validateSchema(valid_number_payload, min_max_schema)).toBeTruthy()
    expect(validateSchema(less_than_min_payload, min_max_schema, { throwIfInvalid: false })).toBeFalsy()
    expect(validateSchema(greater_than_max_payload, min_max_schema, { throwIfInvalid: false })).toBeFalsy()
  })

  it('should allow exempted properties', () => {
    const payload = {
      a: 'a',
      b: {
        anything: 'goes'
      },
      exemptKey: {
        nested: 'nested'
      }
    }

    validateSchema(payload, schema, { schemaKey: `testSchema`, exempt: ['exemptKey'] })
    expect(payload).toHaveProperty('exemptKey')
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "a": "a",
        "b": Object {
          "anything": "goes",
        },
        "exemptKey": Object {
          "nested": "nested",
        },
      }
    `)
  })
})
