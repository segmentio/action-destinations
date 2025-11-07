import { stringifyJsonWithEscapedQuotes, stringifyMappingSchemaForGraphQL } from '../forwardAudienceEvent/functions'

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
