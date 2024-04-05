import { validateSchema } from '../schema-validation'
import { fieldsToJsonSchema } from '../destination-kit/fields-to-jsonschema'

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
  last_name: {
    label: 'Last Name',
    type: 'string',
    required: {
      conditions: [{
      fieldKey: 'operation',
      operator: 'is',
      value: 'create'
    }]
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

describe('validateSchema', () => {
  describe('conditional fields', () => {
    it.only('should validate a conditionally required field when the if statement is true', () => {
      const payload = {
        operation: 'create',
      }

      console.log('schema', schema)
      const validated = validateSchema(payload, schema, { throwIfInvalid: false })

      expect(validated).toBe(false)
    })

    it.only('should validate a conditionally required field when the if statement is false', () => {
      const payload = {
        operation: 'update',
      }

      console.log('schema', schema)
      const validated = validateSchema(payload, schema, { throwIfInvalid: false })

      expect(validated).toBe(true)
    })

    it.only('should validate a one_of conditional when no fields are present', () => {
      const oneOfSchema = fieldsToJsonSchema({
        email: {
          label: 'Email',
          type: 'string',
          required: // either this or phone or userId is required. what is the best syntax to express this?
          {
            match: 'one_of',
            conditions: [{fieldKey: 'phone'}, {fieldKey: 'userId'}]
          }
        },
        phone: {
          label: 'Phone Number',
          type: 'string',
          required: {
            match: 'one_of',
            conditions: [{fieldKey: 'email'}, {fieldKey: 'userId'}]
          }
        },
        userId: {
          label: 'User ID',
          type: 'string',
          required: {
            match: 'one_of',
            conditions: [{fieldKey: 'email'}, {fieldKey: 'phone'}]
          }
        },
      })
      const payload = {}

      const validated = validateSchema(payload, oneOfSchema, { throwIfInvalid: false })

      expect(validated).toBe(false)
    })

    it.only('should validate a one_of conditional when one field is present', () => {
      const oneOfSchema = fieldsToJsonSchema({
        email: {
          label: 'Email',
          type: 'string',
          required: // either this or phone or userId is required. what is the best syntax to express this?
          {
            match: 'one_of',
            conditions: [{fieldKey: 'phone'}, {fieldKey: 'userId'}]
          }
        },
        phone: {
          label: 'Phone Number',
          type: 'string',
          required: {
            match: 'one_of',
            conditions: [{fieldKey: 'email'}, {fieldKey: 'userId'}]
          }
        },
        userId: {
          label: 'User ID',
          type: 'string',
          required: {
            match: 'one_of',
            conditions: [{fieldKey: 'email'}, {fieldKey: 'phone'}]
          }
        },
      })
      const payload = {
        email: 'nick@email.com'
      }

      const validated = validateSchema(payload, oneOfSchema, { throwIfInvalid: false })

      expect(validated).toBe(true)
    })
  })

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
})
