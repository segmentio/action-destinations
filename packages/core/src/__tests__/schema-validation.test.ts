import { validateSchema } from '../schema-validation'
import { MinimalFields, fieldsToJsonSchema } from '../destination-kit/fields-to-jsonschema'
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
  const mockActionFields: Record<string, InputField> = {}

  describe.only('should validate a single conditional requirement', () => {
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
        conditions: [{ fieldKey: 'a', operator: 'is_not', value: 'a_value' }]
      }
    }

    const schema = fieldsToJsonSchema(mockActionFields)

    it.only('should validate b', async () => {
      const b_required_mappings = [{ a: 'a_value' }, { a: 'a_value', b: 'b_value' }]
      // const b_not_required_mapping = [{ 'a': 'not_a_value' }, { 'a': 'not_a_value', 'b': 'b_value' }]

      console.log('schema', JSON.stringify(schema))

      let isValid
      isValid = validateSchema(b_required_mappings[0], schema, { throwIfInvalid: false })
      expect(isValid).toBe(false)

      isValid = validateSchema(b_required_mappings[1], schema, { throwIfInvalid: false })
      expect(isValid).toBe(true)
    })

    it('should validate c', async () => {})
  })

  it('should validate multiple conditional requirements on a single field', async () => {})

  it('should validate when multiple fields have non-overlapping conditional requirements', async () => {})

  it('should validate when multiple fields have overlapping conditional requirements', async () => {})

  it('should validate when a field is conditionally required based on the value of sync mode', async () => {})
})

describe.skip('validateSchema with additional schemas defined', () => {
  const baseSchema: MinimalFields = {
    a: {
      label: 'a',
      type: 'string'
    },
    b: {
      label: 'b',
      type: 'string'
    },
    c: {
      label: 'c',
      type: 'string'
    },
    d: {
      label: 'd',
      type: 'string'
    }
  }

  it('should handle an additional anyOf schema correctly', async () => {
    const anyOfSchema = fieldsToJsonSchema(baseSchema, undefined, {
      anyOf: [{ required: ['a'] }, { required: ['b'] }]
    })

    const validPayload = {
      a: 'a'
    }

    const invalidPayloads = [
      {
        c: 'c'
      },
      {}
    ]

    expect(validateSchema(validPayload, anyOfSchema)).toBe(true)

    expect(validateSchema(invalidPayloads[0], anyOfSchema, { throwIfInvalid: false })).toBe(false)

    expect(validateSchema(invalidPayloads[1], anyOfSchema, { throwIfInvalid: false })).toBe(false)
  })

  it('should handle an additional exclusive oneOf schema correctly', async () => {
    const oneOfSchema = fieldsToJsonSchema(baseSchema, undefined, {
      allOf: [{ oneOf: [{ required: ['a'] }, { required: ['b'] }] }]
    })

    const validPayload = {
      a: 'a'
    }

    const invalidPayload = {
      a: 'a',
      b: 'b'
    }

    expect(validateSchema(validPayload, oneOfSchema)).toBe(true)

    expect(validateSchema(invalidPayload, oneOfSchema, { throwIfInvalid: false })).toBe(false)
  })

  it('should handle mutally exlusive anyOf and oneOf schemas', async () => {
    const multipleAdditionalSchemas = fieldsToJsonSchema(baseSchema, undefined, {
      allOf: [
        { anyOf: [{ required: ['a'] }, { required: ['b'] }] },
        { oneOf: [{ required: ['c'] }, { required: ['d'] }] }
      ]
    })

    const validPayload = {
      a: 'a',
      b: 'b',
      c: 'c'
    }

    const invalidPayloads = [
      {
        a: 'a',
        b: 'b'
      },
      {
        a: 'a',
        c: 'c',
        d: 'd'
      }
    ]

    expect(validateSchema(validPayload, multipleAdditionalSchemas)).toBe(true)

    expect(validateSchema(invalidPayloads[0], multipleAdditionalSchemas, { throwIfInvalid: false })).toBe(false)
    expect(validateSchema(invalidPayloads[1], multipleAdditionalSchemas, { throwIfInvalid: false })).toBe(false)
  })
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
