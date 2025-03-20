import { join } from 'path'
import { transform } from '../index'
import { readdirSync } from 'fs'
import { JSONLikeObject } from '../../json-object'

describe('validations', () => {
  test('valid', () => {
    expect(() => {
      // @ts-expect-error unsupported, but doesn't throw
      transform(['cool'])
    }).not.toThrow()
    expect(() => {
      // @ts-expect-error unsupported, but doesn't throw
      transform(123)
    }).not.toThrow()
    expect(() => {
      transform({ foo: 'bar' })
    }).not.toThrow()
    expect(() => {
      // @ts-expect-error unsupported, but doesn't throw
      transform('neat')
    }).not.toThrow()
    expect(() => {
      transform({ '@path': '$.foo.bar' })
    }).not.toThrow()
    expect(() => {
      transform({ a: 1, b: { '@path': '$.foo.bar' } })
    }).not.toThrow()
    expect(() => {
      transform({ '@literal': '123' })
    }).not.toThrow()
    expect(() => {
      transform({ '@literal': false })
    }).not.toThrow()
  })

  test('invalid', () => {
    expect(() => {
      transform({ a: 1, '@field': '$.foo.bar' })
    }).toThrow()
    expect(() => {
      transform({ oops: { '@merge': [{}, 123] } })
    }).toThrow()
    expect(() => {
      transform({ '@template': false }, {})
    }).toThrow()
    // Further validation tests are in validate.test.js
  })
})

describe('payload validations', () => {
  test('invalid type', () => {
    expect(() => {
      // @ts-expect-error
      transform({ a: 1 }, 123)
    }).toThrowError()
    expect(() => {
      // @ts-expect-error
      transform({ a: 1 }, [])
    }).toThrowError()
  })
})

describe('no-op', () => {
  test('empty mapping', () => {
    const output = transform({}, { cool: false })
    expect(output).toStrictEqual({})
  })

  test('pass-through mapping', () => {
    const output = transform({ cool: true }, {})
    expect(output).toStrictEqual({ cool: true })
  })
})

function* fixtures(subdir: string) {
  const path = join(__dirname, '..', 'schema-fixtures', subdir)
  const files = readdirSync(path, { withFileTypes: true })

  for (const f of files) {
    if (!f.isFile() || !f.name.endsWith('.json')) {
      continue
    }

    // eslint-disable-next-line
    const tests = require(join(path, f.name))
    for (const test of tests) {
      const { input, output, scenario } = test
      yield {
        directive: f.name,
        scenario: scenario,
        input: {
          mapping: input.mapping as unknown as JSONLikeObject,
          data: input.data as unknown as JSONLikeObject
        },
        output: {
          data: output.data as unknown as JSONLikeObject,
          error: output.error
        }
      }
    }
  }
}

describe('directive tests', () => {
  for (const fixture of fixtures('directives')) {
    it(`${fixture.directive}:${fixture.scenario}`, () => {
      if (fixture.output.error) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          transform(fixture.input.mapping, fixture.input.data)
        } catch (error) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          expect((error as Error).message).toMatch(new RegExp(fixture.output.error))
          return
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const result = transform(fixture.input.mapping, fixture.input.data)
        expect(result).toEqual(fixture.output.data)
      }
    })
  }
})

describe('remove undefined values in objects', () => {
  test('simple', () => {
    expect(transform({ x: undefined }, {})).toEqual({})
    expect(transform({ x: null }, {})).toEqual({ x: null })
    expect(transform({ x: 'hi' }, {})).toEqual({ x: 'hi' })
    expect(transform({ x: 1 }, {})).toEqual({ x: 1 })
    expect(transform({ x: {} }, {})).toEqual({ x: {} })
    expect(transform({ x: undefined, y: 1, z: 'hi' }, {})).toEqual({ y: 1, z: 'hi' })
  })

  test('nested', () => {
    expect(transform({ x: { y: undefined, z: 1 }, foo: 1 }, {})).toEqual({
      x: { z: 1 },
      foo: 1
    })
    expect(transform({ x: { y: { z: undefined } }, foo: 1 }, {})).toEqual({
      x: { y: {} },
      foo: 1
    })
  })
})

describe('when a root level directive is used', () => {
  test('correctly handles the segment internal directive key', () => {
    const output = transform(
      {
        __segment_internal_directive: {
          '@transform': {
            apply: {
              properties: {
                '@flatten': {
                  value: { '@path': '$.properties' },
                  separator: '_'
                }
              }
            }
          }
        },
        properties: { '@path': '$.properties' },
        topLevel: { '@path': '$.properties.nested_a' }
      },
      {
        properties: {
          test: 'value',
          another: 'thing',
          nested: {
            a: 'special',
            b: 2
          }
        },
        otherStuff: 'foo',
        more: 'bar'
      }
    )

    expect(output).toStrictEqual({
      properties: {
        test: 'value',
        another: 'thing',
        nested_a: 'special',
        nested_b: 2
      },
      topLevel: 'special'
    })
  })
})
