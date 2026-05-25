import {
  getConfiguredFieldsToMap,
  getConfiguredFieldTypes,
  stringifyJsonWithEscapedQuotes,
  stringifyMappingSchemaForGraphQL
} from '../forwardAudienceEvent/functions'

describe('getConfiguredFieldsToMap', () => {
  it('includes default profile fields and custom traits from destination mapping', () => {
    const fields = getConfiguredFieldsToMap({
      custom_traits: {
        stackadapt_audience_membership: { '@path': '$.traits.stackadapt_audience_membership' },
        custom_trait_1: { '@path': '$.traits.custom_trait_1' }
      }
    })

    expect(fields.has('email')).toBe(true)
    expect(fields.has('first_name')).toBe(true)
    expect(fields.has('stackadapt_audience_membership')).toBe(true)
    expect(fields.has('custom_trait_1')).toBe(true)
  })

  it('excludes reserved audience computation keys from custom trait mappings', () => {
    const fields = getConfiguredFieldsToMap(
      {
        custom_traits: {
          first_time_buyer: { '@path': '$.traits.first_time_buyer' },
          aud_123: { '@path': '$.traits.aud_123' },
          other_trait: { '@path': '$.traits.other_trait' }
        }
      },
      ['first_time_buyer', 'aud_123']
    )

    expect(fields.has('first_time_buyer')).toBe(false)
    expect(fields.has('aud_123')).toBe(false)
    expect(fields.has('other_trait')).toBe(true)
  })

  it('returns the same configured fields when custom traits are absent from batch payloads', () => {
    const rawMapping = {
      custom_traits: {
        stackadapt_audience_membership: { '@path': '$.traits.stackadapt_audience_membership' }
      }
    }

    const fieldsWithTrait = getConfiguredFieldsToMap(rawMapping)
    const fieldsWithoutTrait = getConfiguredFieldsToMap(rawMapping)

    expect(fieldsWithTrait).toEqual(fieldsWithoutTrait)
    expect(fieldsWithTrait.has('stackadapt_audience_membership')).toBe(true)
  })
})

describe('getConfiguredFieldTypes', () => {
  it('defaults configured custom traits to STRING type', () => {
    const fieldTypes = getConfiguredFieldTypes({
      custom_traits: {
        stackadapt_audience_membership: { '@path': '$.traits.stackadapt_audience_membership' }
      }
    })

    expect(fieldTypes.birth_date).toBe('DATE')
    expect(fieldTypes.stackadapt_audience_membership).toBe('STRING')
  })
})

describe('stringifyJsonWithEscapedQuotes', () => {
  it('should escape quotes in a simple object', () => {
    const input = { name: 'John Doe' }
    const expected = '{\\"name\\":\\"John Doe\\"}'
    expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
  })

  it('should handle nested objects', () => {
    const input = { user: { name: 'John', age: 30 } }
    const expected = '{\\"user\\":{\\"name\\":\\"John\\",\\"age\\":30}}'
    expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
  })

  it('should handle arrays', () => {
    const input = { tags: ['tag1', 'tag2'] }
    const expected = '{\\"tags\\":[\\"tag1\\",\\"tag2\\"]}'
    expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
  })

  it('should handle empty objects and arrays', () => {
    const input = { emptyObj: {}, emptyArr: [] }
    const expected = '{\\"emptyObj\\":{},\\"emptyArr\\":[]}'
    expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
  })

  it('should handle special characters in strings', () => {
    const input = { text: 'Hello "World" with \'quotes\'' }
    const expected = '{\\"text\\":\\"Hello \\\\"World\\\\" with \'quotes\'\\"}'
    expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
  })

  it('should handle primitive values', () => {
    expect(stringifyJsonWithEscapedQuotes('string')).toBe('\\"string\\"')
    expect(stringifyJsonWithEscapedQuotes(123)).toBe('123')
    expect(stringifyJsonWithEscapedQuotes(true)).toBe('true')
    expect(stringifyJsonWithEscapedQuotes(null)).toBe('null')
  })
})

describe('stringifyMappingSchemaForGraphQL', () => {
  it('should transform simple mapping object for GraphQL', () => {
    const input = {
      incomingKey: 'userId',
      destinationKey: 'external_id',
      label: 'User Id',
      type: 'STRING',
      isPii: false
    }
    const expected = '{incomingKey:"userId",destinationKey:"external_id",label:"User Id",type:STRING,isPii:false}'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })

  it('should transform type field to uppercase and unquoted', () => {
    const input = { type: 'string' }
    const expected = '{type:STRING}'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })

  it("should transform type field when it's already uppercase", () => {
    const input = { type: 'STRING' }
    const expected = '{type:STRING}'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })

  it('should handle array of mapping objects', () => {
    const input = [
      {
        incomingKey: 'userId',
        destinationKey: 'external_id',
        type: 'STRING',
        isPii: false,
        label: 'External Profile ID'
      },
      {
        incomingKey: 'email',
        destinationKey: 'email',
        type: 'string',
        isPii: true,
        label: 'Email Address'
      }
    ]
    const expected =
      '[{incomingKey:"userId",destinationKey:"external_id",type:STRING,isPii:false,label:"External Profile ID"},{incomingKey:"email",destinationKey:"email",type:STRING,isPii:true,label:"Email Address"}]'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })

  it('should handle different type values', () => {
    const input = {
      mappings: [
        { type: 'string', field: 'name' },
        { type: 'number', field: 'age' },
        { type: 'boolean', field: 'active' }
      ]
    }
    const expected = '{mappings:[{type:STRING,field:"name"},{type:NUMBER,field:"age"},{type:BOOLEAN,field:"active"}]}'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })

  it('should unquote all object keys for GraphQL syntax', () => {
    const input = {
      incomingKey: 'test',
      destinationKey: 'test_field',
      customProperty: 'value',
      type: 'string'
    }
    const expected = '{incomingKey:"test",destinationKey:"test_field",customProperty:"value",type:STRING}'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })

  it('should preserve string values with quotes', () => {
    const input = {
      label: 'User Name with "quotes"',
      description: 'Field description',
      type: 'string'
    }
    const expected = '{label:"User Name with \\"quotes\\"",description:"Field description",type:STRING}'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })

  it('should handle nested objects', () => {
    const input = {
      field: {
        incomingKey: 'nested',
        type: 'string'
      },
      type: 'object'
    }
    const expected = '{field:{incomingKey:"nested",type:STRING},type:OBJECT}'
    expect(stringifyMappingSchemaForGraphQL(input)).toBe(expected)
  })
})
