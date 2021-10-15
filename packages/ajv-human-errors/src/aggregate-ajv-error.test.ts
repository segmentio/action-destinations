import Ajv, { JSONSchemaType, Schema } from 'ajv'
import addFormats from 'ajv-formats'
import { AggregateAjvError, AjvError } from './aggregate-ajv-error'
import type { Options, FieldLabels } from './entities'

const ajv = addFormats(new Ajv({
  allErrors: true,
  verbose: true,
  strict: false,
}));

describe('AjvError', () => {
  const error = <T>(
    schema: Schema | JSONSchemaType<T>,
    payload: unknown,
    opts: Options = {}
  ) => {
    const validate = ajv.compile(schema);
    validate(payload);
    if (!validate.errors) {
      console.log({ errors: validate.errors });
      throw new Error("ajv didn't return any errors");
    }
    return new AjvError(validate.errors[validate.errors.length - 1], opts);
  };

  describe('base keywords', () => {
    it('returns error when a object was expected but a array was provided', () => {
      const schema = { type: 'object' };
      expect(error(schema, []).message).toStrictEqual(
        'The root value must be an object but it was an array.'
      );
    });

    it('returns error when a object was expected but a number was provided', () => {
      const schema = { type: 'object' };
      expect(error(schema, 1).message).toStrictEqual(
        'The root value must be an object but it was a number.'
      );
    });

    it('returns error when a number was expected but a string was provided', () => {
      const schema = { type: 'number' };
      expect(error(schema, 'oops').message).toStrictEqual(
        'The root value must be a number but it was a string.'
      );
    });

    it('returns error when a number or string was expected but a object was provided', () => {
      const schema = { type: ['number', 'string'] };
      expect(error(schema, {}).message).toStrictEqual(
        'The root value must be a number or string but it was an object.'
      );
    });

    it('returns nested errors', () => {
      const schema = {
        properties: {
          foo: {
            properties: {
              bar: {
                type: 'string',
              },
            },
          },
        },
      };
      const payload = {
        foo: {
          bar: {},
        },
      };
      expect(error(schema, payload).message).toStrictEqual(
        'The value at /foo/bar must be a string but it was an object.'
      );
    });

    it('returns enum errors', () => {
      const schema = { enum: ['foo', 'bar', 10] };
      expect(error(schema, {}).message).toStrictEqual(
        'The root value must be one of: "foo", "bar", or 10.'
      );
    });
  });

  describe('options', () => {
    it.each<[FieldLabels, string]>([
      ['js', 'The value at .foo must be a string but it was a number.'],
      ['jsonPath', 'The value at $.foo must be a string but it was a number.'],
      ['jsonPointer', 'The value at /foo must be a string but it was a number.'],
      ['instancePath', 'The value at /foo must be a string but it was a number.'],
      ['title', 'Smurf must be a string but it was a number.'],
    ])("fieldLabels: '%s'", (fieldLabels, expected) => {
      expect(error({
        type: 'object',
        properties: {
          foo: {
            title: 'Smurf',
            type: 'string',
          },
        },
      }, { foo: 1 }, { fieldLabels }).message).toStrictEqual(expected);
    });

    it('handles includeOriginalError', () => {
      expect(error(
        { type: 'string' },
        {},
      ).original).toBeUndefined();

      expect(error(
        { type: 'string' },
        {},
        { includeOriginalError: true }
      ).original).toStrictEqual({
        data: {},
        instancePath: '',
        keyword: 'type',
        message: 'must be string',
        params: { type: 'string' },
        parentSchema: { type: 'string' },
        schema: 'string',
        schemaPath: '#/type',
      });
    });

    it('handles includeData', () => {
      expect(error(
        { type: 'string' },
        { oops: true }
      ).data).toBeUndefined();

      expect(error(
        { type: 'string' },
        { oops: true },
        { includeData: true }
      ).data).toStrictEqual(
        { oops: true }
      );
    });
  });

  describe('strings', () => {
    it('4 characters, expected minimum of 10', () => {
      const schema = { type: 'string', minLength: 10 };
      expect(error(schema, 'oops').message).toStrictEqual(
        'The root value must be 10 characters or more but it was 4 characters.'
      );
    });

    it('0 characters, expected minimum of 1', () => {
      const schema = { type: 'string', minLength: 1 };
      expect(error(schema, '').message).toStrictEqual(
        'The root value must be 1 character or more but it was 0 characters.'
      );
    });

    it('4 characters, expected maximum of 3', () => {
      const schema = { type: 'string', maxLength: 3 };
      expect(error(schema, 'oops').message).toStrictEqual(
        'The root value must be 3 characters or fewer but it was 4 characters.'
      );
    });

    it('invalid string pattern', () => {
      const schema = { type: 'string', pattern: '^\\d+$' };
      expect(error(schema, 'oops').message).toStrictEqual(
        'The root value is an invalid string.'
      );
    });

    it('invalid integer string', () => {
      const schema = { type: 'string', pattern: '^\\d+$', patternLabel: 'an integer string' };
      expect(error(schema, 'oops').message).toStrictEqual(
        'The root value must be an integer string but it was not.'
      );
    });

    it.each([
      { format: 'date-time', label: 'date and time' },
      { format: 'time', label: 'time' },
      { format: 'date', label: 'date' },
      { format: 'email', label: 'email address' },
      { format: 'hostname', label: 'hostname' },
      { format: 'ipv4', label: 'IPv4 address' },
      { format: 'ipv6', label: 'IPv6 address' },
      { format: 'uri', label: 'URI' },
      { format: 'regex', label: 'regular expression', value: '[' },
    ])('returns format errors: %s', ({ format, label, value = '' }) => {
      const schema = { type: 'string', format };
      expect(error(schema, value).message).toStrictEqual(
        `The root value must be a valid ${label} string but it was not.`
      );
    });
  });

  describe('numbers', () => {
    it('returns multipleOf errors', () => {
      const schema = { type: 'number', multipleOf: 10 };
      expect(error(schema, 1).message).toStrictEqual(
        'The root value must be a multiple of 10.'
      );
    });

    it('returns range errors', () => {
      expect(error(
        { type: 'number', minimum: 5 },
        1
      ).message).toStrictEqual(
        'The root value must be equal to or greater than 5.'
      );

      expect(error(
        { type: 'number', exclusiveMinimum: 5 },
        5
      ).message).toStrictEqual(
        'The root value must be greater than 5.'
      );

      expect(error(
        { type: 'number', maximum: 5 },
        10
      ).message).toStrictEqual(
        'The root value must be equal to or less than 5.'
      );

      expect(error(
        { type: 'number', exclusiveMaximum: 5 },
        5
      ).message).toStrictEqual(
        'The root value must be less than 5.'
      );
    });
  });

  describe('objects', () => {
    it('returns additionalProperty errors', () => {
      expect(error(
        { properties: { a: {}, d: {} }, additionalProperties: false },
        { a: 1, b: 2, c: 3 }
      ).message).toStrictEqual(
        'The root value has an unexpected property, c, which is not in the list of allowed properties (a, d).'
      );

      expect(error(
        { properties: { a: {} }, additionalProperties: { type: 'string' } },
        { a: 1, b: 2 }
      ).message).toStrictEqual(
        'The value at /b must be a string but it was a number.'
      );
    });

    it('returns required errors', () => {
      expect(error(
        { required: ['foo'] },
        {}
      ).message).toStrictEqual(
        "The root value is missing the required field 'foo'."
      );

      expect(error(
        { required: ['foo', 'bar'] },
        {}
      ).message).toStrictEqual(
        "The root value is missing the required field 'bar'."
      );
    });

    it('returns propertyNames errors', () => {
      expect(error(
        { type: 'object', propertyNames: { pattern: '^\\d+$' } },
        { oops: 1 }
      ).message).toStrictEqual(
        'The root value has an invalid property name "oops".'
      );
    });

    it('returns size errors', () => {
      expect(error(
        { type: 'object', minProperties: 5 },
        { a: 1 }
      ).message).toStrictEqual(
        'The root value must have 5 or more properties but it has 1.'
      );

      expect(error(
        { type: 'object', maxProperties: 2 },
        { a: 1, b: 2, c: 3 }
      ).message).toStrictEqual(
        'The root value must have 2 or fewer properties but it has 3.'
      );
    });

    it('returns dependency errors', () => {
      expect(error(
        { type: 'object', dependencies: { a: ['b', 'c'] } },
        { a: 1 }
      ).message).toStrictEqual(
        'The root value must have property c when a is present.'
      );
    });
  });

  describe('arrays', () => {
    it('returns items errors', () => {
      expect(error(
        { type: 'array', items: { type: 'number' } },
        ['x']
      ).message).toStrictEqual(
        'The value at /0 must be a number but it was a string.'
      );

      expect(error(
        { properties: { nums: { type: 'array', items: { type: 'number' } } } },
        { nums: [0, 'x'] }
      ).message).toStrictEqual(
        'The value at /nums/1 must be a number but it was a string.'
      );

      expect(error(
        { properties: { nums: { type: 'array', items: { enum: ['a'] } } } },
        { nums: [0, 'x'] }
      ).message).toStrictEqual(
        'The value at /nums/1 must be one of: "a".'
      );

      expect(error(
        { properties: { tuple: { type: 'array', items: [{ type: 'string' }, { type: 'number' }] } } },
        { tuple: [0, 'x'] }
      ).message).toStrictEqual(
        'The value at /tuple/1 must be a number but it was a string.'
      );
    });

    it('returns length errors', () => {
      expect(error(
        { type: 'array', minItems: 1 },
        []
      ).message).toStrictEqual(
        'The root value must have 1 or more items but it has 0.'
      );

      expect(error(
        { type: 'array', maxItems: 1 },
        [0, 1, 2]
      ).message).toStrictEqual(
        'The root value must have 1 or fewer items but it has 3.'
      );
    });

    it('returns uniqueItems errors', () => {
      expect(error(
        { type: 'array', uniqueItems: true },
        [0, 1, 2, 0, 1]
      ).message).toStrictEqual(
        'The root value must be unique but elements 1 and 4 are the same.'
      );
    });
  });

  describe('toJSON', () => {
    it('returns object', () => {
      expect(error(
        {
          type: 'object',
          properties: {
            arr: { type: 'array', uniqueItems: true },
          },
        },
        { arr: [0, 1, 2, 0, 1] }
      ).toJSON()).toStrictEqual({
        message: 'The value at /arr must be unique but elements 1 and 4 are the same.',
        path: '$.arr',
        pointer: '/arr',
      });

      expect(error(
        {
          type: 'object',
          properties: {
            arr: { type: 'array', uniqueItems: true },
          },
        },
        { arr: [0, 1, 2, 0, 1] },
        { includeOriginalError: true, includeData: true }
      ).toJSON()).toStrictEqual({
        data: [0, 1, 2, 0, 1],
        message: 'The value at /arr must be unique but elements 1 and 4 are the same.',
        original: {
          data: [0, 1, 2, 0, 1],
          instancePath: '/arr',
          keyword: 'uniqueItems',
          message: 'must NOT have duplicate items (items ## 1 and 4 are identical)',
          params: { i: 4, j: 1 },
          parentSchema: { type: 'array', uniqueItems: true },
          schema: true,
          schemaPath: '#/properties/arr/uniqueItems',
        },
        path: '$.arr',
        pointer: '/arr',
      });
    });
  });

  describe('schema options', () => {
    describe('errorMessage', () => {
      it('overrides generated error message', () => {
        expect(error(
          { type: 'string', errorMessage: 'must be a fancy string' },
          {}
        ).message).toStrictEqual(
          'The root value must be a fancy string.'
        );

        expect(error(
          { type: 'string', errorMessage: 'must be a fancy string' },
          {},
          { fieldLabels: 'jsonPath' }
        ).message).toStrictEqual(
          'The value at $ must be a fancy string.'
        );
      });
    });
  });
});

describe('AggregateAjvError', () => {
  const error = <T>(schema: Schema | JSONSchemaType<T>, payload: unknown, opts: Options = {}) => {
    ajv.validate(schema, payload);
    const { errors } = ajv;
    if (!errors) {
      throw new Error("ajv didn't return any errors");
    }
    return new AggregateAjvError(errors, opts);
  };

  it('aggregates errors', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'number' },
      },
    };
    const payload = { a: null, b: null };
    expect(error(schema, payload).message).toStrictEqual(
      'The value at /a must be a string but it was null. The value at /b must be a number but it was null.'
    );
  });

  it('accepts AjvError options', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { title: 'Stringy', type: 'string' },
        b: { type: 'number' },
      },
    };
    const payload = { a: null, b: null };
    expect(error(schema, payload, { fieldLabels: 'title' }).message).toStrictEqual(
      'Stringy must be a string but it was null. The value at /b must be a number but it was null.'
    );
  });

  it('supports JSON', () => {
    const schema = {
      type: 'object',
      properties: {
        arr: { type: 'array', uniqueItems: true },
      },
    };
    const payload = { arr: [0, 1, 2, 0, 1] };
    expect(error(schema, payload).toJSON()).toStrictEqual([
      {
        message: 'The value at /arr must be unique but elements 1 and 4 are the same.',
        path: '$.arr',
        pointer: '/arr',
      },
    ]);
  });

  it('is an iterator', () => {
    const schema = {
      type: 'object',
      properties: {
        a: { type: 'string' },
        b: { type: 'number' },
      },
    };
    const payload = { a: null, b: null };
    const err = error(
      schema,
      payload
    );
    const errors = [...err];

    expect(errors.length).toStrictEqual(2);
    expect(errors.map(e => e.message)).toStrictEqual([
      'The value at /a must be a string but it was null.',
      'The value at /b must be a number but it was null.',
    ]);
  });
});
