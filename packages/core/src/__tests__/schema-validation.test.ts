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
