const { AggregateAjvError, AjvError } = require('./index')

const Ajv = require('ajv')
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  jsonPointers: true
})

describe('AjvError', () => {
  function error (schema, payload, opts = {}) {
    ajv.validate(schema, payload)
    if (!ajv.errors) throw new Error("ajv didn't return any errors")
    return new AjvError(ajv.errors[ajv.errors.length - 1], opts)
  }

  describe('base keywords', () => {
    it('returns type errors', () => {
      expect(error(
        { type: 'object' },
        []
      ).message).toStrictEqual(
        'The root value should be an object but it was an array.'
      )

      expect(error(
        { type: 'object' },
        1
      ).message).toStrictEqual(
        'The root value should be an object but it was a number.'
      )

      expect(error(
        { type: 'number' },
        'oops'
      ).message).toStrictEqual(
        'The root value should be a number but it was a string.'
      )

      expect(error(
        { type: ['number', 'string'] },
        {}
      ).message).toStrictEqual(
        'The root value should be a number or string but it was an object.'
      )
    })

    it('returns nested errors', () => {
      expect(error(
        { properties: { foo: { properties: { bar: { type: 'string' } } } } },
        { foo: { bar: {} } }
      ).message).toStrictEqual(
        'The value at /foo/bar should be a string but it was an object.'
      )
    })

    it('returns enum errors', () => {
      expect(error(
        { enum: ['foo', 'bar', 10] },
        {}
      ).message).toStrictEqual(
        'The root value should be one of: "foo", "bar", or 10.'
      )
    })
  })

  describe('options', () => {
    describe.each([
      ['js', 'The value at .foo should be a string but it was a number.'],
      ['jsonPath', 'The value at $.foo should be a string but it was a number.'],
      ['jsonPointer', 'The value at /foo should be a string but it was a number.'],
      ['title', 'Smurf should be a string but it was a number.']
    ])("fieldLabels: '%s'", (fieldLabels, expected) => {
      expect(error(
        { type: 'object', properties: { foo: { title: 'Smurf', type: 'string' } } },
        { foo: 1 },
        { fieldLabels: fieldLabels }
      ).message).toStrictEqual(expected)
    })

    it('handles includeOriginalError', () => {
      expect(error(
        { type: 'string' },
        {},
        {}
      ).original).toBeUndefined()

      expect(error(
        { type: 'string' },
        {},
        { includeOriginalError: true }
      ).original).toStrictEqual({
        data: {},
        dataPath: '',
        keyword: 'type',
        message: 'should be string',
        params: { type: 'string' },
        parentSchema: { type: 'string' },
        schema: 'string',
        schemaPath: '#/type'
      })
    })

    it('handles includeData', () => {
      expect(error(
        { type: 'string' },
        { oops: true },
        {}
      ).data).toBeUndefined()

      expect(error(
        { type: 'string' },
        { oops: true },
        { includeData: true }
      ).data).toStrictEqual(
        { oops: true }
      )
    })
  })

  describe('strings', () => {
    it('returns format errors', () => {
      expect(error(
        { type: 'string', minLength: 10 },
        'oops'
      ).message).toStrictEqual(
        'The root value should be 10 characters or more but it was 4 characters.'
      )

      expect(error(
        { type: 'string', minLength: 1 },
        ''
      ).message).toStrictEqual(
        'The root value should be 1 character or more but it was 0 characters.'
      )

      expect(error(
        { type: 'string', maxLength: 3 },
        'oops'
      ).message).toStrictEqual(
        'The root value should be 3 characters or fewer but it was 4 characters.'
      )

      expect(error(
        { type: 'string', pattern: '^\\d+$' },
        'oops'
      ).message).toStrictEqual(
        'The root value is an invalid string.'
      )

      expect(error(
        { type: 'string', pattern: '^\\d+$', patternLabel: 'an integer string' },
        'oops'
      ).message).toStrictEqual(
        'The root value should be an integer string but it was not.'
      )

      const testcases = [
        { format: 'date-time', label: 'date and time', value: '' },
        { format: 'time', label: 'time', value: '' },
        { format: 'date', label: 'date', value: '' },
        { format: 'email', label: 'email address', value: '' },
        { format: 'hostname', label: 'hostname', value: '' },
        { format: 'ipv4', label: 'IPv4 address', value: '' },
        { format: 'ipv6', label: 'IPv6 address', value: '' },
        { format: 'uri', label: 'URI', value: '' },
        { format: 'regex', label: 'regular expression', value: '[' }
      ]

      testcases.forEach(testcase => {
        const { format, label, value } = testcase
        expect(error(
          { type: 'string', format },
          value
        ).message).toStrictEqual(
          `The root value should be a valid ${label} string but it was not.`
        )
      })
    })
  })

  describe('numbers', () => {
    it('returns multipleOf errors', () => {
      expect(error(
        { type: 'number', multipleOf: 10 },
        1
      ).message).toStrictEqual(
        'The root value should be a multiple of 10.'
      )
    })

    it('returns range errors', () => {
      expect(error(
        { type: 'number', minimum: 5 },
        1
      ).message).toStrictEqual(
        'The root value should be equal to or greater than 5.'
      )

      expect(error(
        { type: 'number', exclusiveMinimum: 5 },
        5
      ).message).toStrictEqual(
        'The root value should be greater than 5.'
      )

      expect(error(
        { type: 'number', maximum: 5 },
        10
      ).message).toStrictEqual(
        'The root value should be equal to or less than 5.'
      )

      expect(error(
        { type: 'number', exclusiveMaximum: 5 },
        5
      ).message).toStrictEqual(
        'The root value should be less than 5.'
      )
    })
  })

  describe('objects', () => {
    it('returns additionalProperty errors', () => {
      expect(error(
        { properties: { a: {}, d: {} }, additionalProperties: false },
        { a: 1, b: 2, c: 3 }
      ).message).toStrictEqual(
        'The root value has an unexpected property, c, which is not in the list of allowed properties (a, d).'
      )

      expect(error(
        { properties: { a: {} }, additionalProperties: { type: 'string' } },
        { a: 1, b: 2 }
      ).message).toStrictEqual(
        'The value at /b should be a string but it was a number.'
      )
    })

    it('returns required errors', () => {
      expect(error(
        { required: ['foo'] },
        {}
      ).message).toStrictEqual(
        "The root value is missing the required field 'foo'."
      )

      expect(error(
        { required: ['foo', 'bar'] },
        {}
      ).message).toStrictEqual(
        "The root value is missing the required field 'bar'."
      )
    })

    it('returns propertyNames errors', () => {
      expect(error(
        { type: 'object', propertyNames: { pattern: '^\\d+$' } },
        { oops: 1 }
      ).message).toStrictEqual(
        'The root value has an invalid property name "oops".'
      )
    })

    it('returns size errors', () => {
      expect(error(
        { type: 'object', minProperties: 5 },
        { a: 1 }
      ).message).toStrictEqual(
        'The root value should have 5 or more properties but it has 1.'
      )

      expect(error(
        { type: 'object', maxProperties: 2 },
        { a: 1, b: 2, c: 3 }
      ).message).toStrictEqual(
        'The root value should have 2 or fewer properties but it has 3.'
      )
    })

    it('returns dependency errors', () => {
      expect(error(
        { type: 'object', dependencies: { a: ['b', 'c'] } },
        { a: 1 }
      ).message).toStrictEqual(
        'The root value should have property c when a is present.'
      )
    })
  })

  describe('arrays', () => {
    it('returns items errors', () => {
      expect(error(
        { type: 'array', items: { type: 'number' } },
        ['x']
      ).message).toStrictEqual(
        'The value at /0 should be a number but it was a string.'
      )

      expect(error(
        { properties: { nums: { type: 'array', items: { type: 'number' } } } },
        { nums: [0, 'x'] }
      ).message).toStrictEqual(
        'The value at /nums/1 should be a number but it was a string.'
      )

      expect(error(
        { properties: { nums: { type: 'array', items: { enum: ['a'] } } } },
        { nums: [0, 'x'] }
      ).message).toStrictEqual(
        'The value at /nums/1 should be one of: "a".'
      )

      expect(error(
        { properties: { tuple: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] } } },
        { tuple: [0, 'x'] }
      ).message).toStrictEqual(
        'The value at /tuple/1 should be a number but it was a string.'
      )
    })

    it('returns length errors', () => {
      expect(error(
        { type: 'array', minItems: 1 },
        []
      ).message).toStrictEqual(
        'The root value should have 1 or more items but it has 0.'
      )

      expect(error(
        { type: 'array', maxItems: 1 },
        [0, 1, 2]
      ).message).toStrictEqual(
        'The root value should have 1 or fewer items but it has 3.'
      )
    })

    it('returns uniqueItems errors', () => {
      expect(error(
        { type: 'array', uniqueItems: true },
        [0, 1, 2, 0, 1]
      ).message).toStrictEqual(
        'The root value should be unique but elements 1 and 4 are the same.'
      )
    })
  })

  describe('toJSON', () => {
    it('returns object', () => {
      expect(error(
        {
          type: 'object',
          properties: {
            arr: { type: 'array', uniqueItems: true }
          }
        },
        { arr: [0, 1, 2, 0, 1] }
      ).toJSON()).toStrictEqual({
        message: 'The value at /arr should be unique but elements 1 and 4 are the same.',
        path: '$.arr',
        pointer: '/arr'
      })

      expect(error(
        {
          type: 'object',
          properties: {
            arr: { type: 'array', uniqueItems: true }
          }
        },
        { arr: [0, 1, 2, 0, 1] },
        { includeOriginalError: true, includeData: true }
      ).toJSON()).toStrictEqual({
        data: [0, 1, 2, 0, 1],
        message: 'The value at /arr should be unique but elements 1 and 4 are the same.',
        original: {
          data: [0, 1, 2, 0, 1],
          dataPath: '/arr',
          keyword: 'uniqueItems',
          message: 'should NOT have duplicate items (items ## 1 and 4 are identical)',
          params: { i: 4, j: 1 },
          parentSchema: { type: 'array', uniqueItems: true },
          schema: true,
          schemaPath: '#/properties/arr/uniqueItems'
        },
        path: '$.arr',
        pointer: '/arr'
      })
    })
  })

  describe('schema options', () => {
    describe('errorMessage', () => {
      it('overrides generated error message', () => {
        expect(error(
          { type: 'string', errorMessage: 'should be a fancy string' },
          {}
        ).message).toStrictEqual(
          'The root value should be a fancy string.'
        )

        expect(error(
          { type: 'string', errorMessage: 'should be a fancy string' },
          {},
          { fieldLabels: 'jsonPath' }
        ).message).toStrictEqual(
          'The value at $ should be a fancy string.'
        )
      })
    })
  })
})

describe('AggregateAjvError', () => {
  function error (schema, payload, opts = {}) {
    ajv.validate(schema, payload)
    if (!ajv.errors) throw new Error("ajv didn't return any errors")
    return new AggregateAjvError(ajv.errors, opts)
  }

  it('aggregates errors', () => {
    expect(error(
      {
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'number' }
        }
      },
      { a: null, b: null }
    ).message).toStrictEqual(
      'The value at /a should be a string but it was null. The value at /b should be a number but it was null.'
    )
  })

  it('accepts AjvError options', () => {
    expect(error(
      {
        type: 'object',
        properties: {
          a: { title: 'Stringy', type: 'string' },
          b: { type: 'number' }
        }
      },
      { a: null, b: null },
      { fieldLabels: 'title' }
    ).message).toStrictEqual(
      'Stringy should be a string but it was null. The value at /b should be a number but it was null.'
    )
  })

  it('supports JSON', () => {
    expect(error(
      {
        type: 'object',
        properties: {
          arr: { type: 'array', uniqueItems: true }
        }
      },
      { arr: [0, 1, 2, 0, 1] }
    ).toJSON()).toStrictEqual([
      {
        message: 'The value at /arr should be unique but elements 1 and 4 are the same.',
        path: '$.arr',
        pointer: '/arr'
      }
    ])
  })

  it('is an iterator', () => {
    const err = error(
      {
        type: 'object',
        properties: {
          a: { type: 'string' },
          b: { type: 'number' }
        }
      },
      { a: null, b: null }
    )
    const errors = [...err]

    expect(errors.length).toStrictEqual(2)
    expect(errors.map(e => e.message)).toStrictEqual([
      'The value at /a should be a string but it was null.',
      'The value at /b should be a number but it was null.'
    ])
  })
})
