import { fieldsToJsonSchema } from '../destination-kit/fields-to-jsonschema'
import { InputField } from '../destination-kit/types'

describe('conditionally required field schema generation', () => {
  it('should generate a schema when one field depends on another', async () => {
    const mockActionFields: Record<string, InputField> = {}
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

    console.log('schema:', schema)
    /** expecting an object with:
         *   required: [ 'a' ],
            if: {
                properties: {"a": {"const": "a_value"}}
            },
            then: { "required": ["b"] }
         */
    expect(schema).toMatchInlineSnapshot(``)
  })

  it('should generate a schema when one field depends on multiple other fields', async () => {
    const mockActionFields: Record<string, InputField> = {}
    mockActionFields['a'] = {
      label: 'a',
      type: 'string',
      required: true,
      description: 'a'
    }

    mockActionFields['b'] = {
      label: 'b',
      type: 'string',
      description: 'b'
    }

    mockActionFields['c'] = {
      label: 'c',
      type: 'string',
      description: 'c',
      required: {
        conditions: [
          { fieldKey: 'a', operator: 'is', value: 'a_value' },
          { fieldKey: 'b', operator: 'is', value: 'b_value' }
        ]
      }
    }

    const schema = fieldsToJsonSchema(mockActionFields)

    console.log('schema:', schema)
    /** expecting an object with:
          if: {
            properties: { a: { const: 'a_value' }, b: { const: 'b_value' } }
          },
          then: { required: [ 'c' ] }
         */
    expect(schema).toMatchInlineSnapshot(``)
  })

  it('should generate a schema when multiple fields depend on one field', async () => {})

  it('should generate a schema when multiple fields depend on multiple other fields and do not intersect', async () => {})

  it('should generate a schema when multiple fields depend on multiple other fields and intersect', async () => {})

  it('should generate a schema when a field is required based on the value of syncMode', async () => {})
})

describe('conditionally required field validation', () => {})
