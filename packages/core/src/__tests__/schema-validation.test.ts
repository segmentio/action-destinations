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
  }
})

describe('validateSchema', () => {
  it('should remove any keys that are not specified', () => {
    const payload = {
      nope: 'not a property'
    }

    validateSchema(payload, schema, `testSchema`)

    expect(payload).not.toHaveProperty('nope')
    expect(payload).toMatchInlineSnapshot(`Object {}`)
  })

  it('should not remove nested keys for valid properties', () => {
    const payload = {
      a: 1234,
      b: {
        anything: 'goes'
      },
      c: {
        d: 'works!',
        whatever: 'also works!'
      },
      e: 'true',
      f: '123'
    }

    validateSchema(payload, schema, `testSchema`)
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "a": "1234",
        "b": Object {
          "anything": "goes",
        },
        "c": Object {
          "d": "works!",
          "whatever": "also works!",
        },
        "e": true,
        "f": 123,
      }
    `)
  })

  it('should coerce properties for more flexible but type-safe inputs', () => {
    const payload = {
      a: 1234,
      e: 'true',
      f: '123'
    }

    validateSchema(payload, schema, `testSchema`)
    expect(payload).toMatchInlineSnapshot(`
      Object {
        "a": "1234",
        "e": true,
        "f": 123,
      }
    `)
  })
})
