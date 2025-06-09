import { stringifyJsonWithEscapedQuotes } from '../functions'

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

  describe('type field transformation', () => {
    it('should transform type field to uppercase without quotes', () => {
      const input = { type: 'string' }
      const expected = '{\\"type\\":STRING}'
      expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
    })

    it('should transform type field when it\'s already uppercase', () => {
      const input = { type: 'STRING' }
      const expected = '{\\"type\\":STRING}'
      expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
    })

    it('should transform type field in nested objects', () => {
      const input = { data: { type: 'string' } }
      const expected = '{\\"data\\":{\\"type\\":STRING}}'
      expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
    })

    it('should transform type fields in an array of objects', () => {
      const input = {
        mappings: [
          { type: 'string', field: 'name' },
          { type: 'number', field: 'age' },
          { type: 'boolean', field: 'active' }
        ]
      }
      const expected = '{\\"mappings\\":[{\\"type\\":STRING,\\"field\\":\\"name\\"},{\\"type\\":NUMBER,\\"field\\":\\"age\\"},{\\"type\\":BOOLEAN,\\"field\\":\\"active\\"}]}'
      expect(stringifyJsonWithEscapedQuotes(input)).toBe(expected)
    })
  })
}) 