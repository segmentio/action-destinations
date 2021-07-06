import { transform } from '../index'

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
  })

  test('invalid', () => {
    expect(() => {
      transform({ a: 1, '@field': '$.foo.bar' })
    }).toThrow()
    expect(() => {
      transform({ oops: { '@merge': [{}, 123] } })
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

describe('@if', () => {
  const payload = { a: 1, b: true, c: false, d: null }

  test('exists', () => {
    let output = transform(
      {
        '@if': {
          exists: { '@path': '$.a' },
          then: 1,
          else: 2
        }
      },
      payload
    )
    expect(output).toStrictEqual(1)

    output = transform(
      {
        '@if': {
          exists: { '@path': '$.d' },
          then: 1,
          else: 2
        }
      },
      payload
    )
    expect(output).toStrictEqual(2)

    output = transform(
      {
        '@if': {
          exists: { '@path': '$.x' },
          then: 1,
          else: 2
        }
      },
      payload
    )
    expect(output).toStrictEqual(2)
  })
})

describe('@path', () => {
  test('simple', () => {
    const output = transform({ neat: { '@path': '$.foo' } }, { foo: 'bar' })
    expect(output).toStrictEqual({ neat: 'bar' })
  })

  test('nested path', () => {
    const output = transform({ neat: { '@path': '$.foo.bar' } }, { foo: { bar: 'baz' } })
    expect(output).toStrictEqual({ neat: 'baz' })
  })

  test('nested directive', () => {
    const output = transform({ '@path': { '@path': '$.foo' } }, { foo: 'bar', bar: 'baz' })
    expect(output).toStrictEqual('baz')
  })

  test('invalid path', () => {
    const output = transform({ neat: { '@path': '$.oops' } }, { foo: 'bar' })
    expect(output).toStrictEqual({})
  })

  test('invalid key type', () => {
    expect(() => {
      transform({ neat: { '@path': {} } }, { foo: 'bar' })
    }).toThrowError()
  })

  test('invalid nested value type', () => {
    const output = transform({ neat: { '@path': '$.foo.bar.baz' } }, { foo: 'bar' })
    expect(output).toStrictEqual({})
  })
})

describe('@template', () => {
  test('basic', () => {
    const output = transform({ '@template': 'Hello, {{who}}!' }, { who: 'World' })
    expect(output).toStrictEqual('Hello, World!')
  })

  test('nested fields', () => {
    const output = transform({ '@template': 'Hello, {{who.name}}!' }, { who: { name: 'World' } })
    expect(output).toStrictEqual('Hello, World!')
  })

  test('no escaping', () => {
    const output = transform({ '@template': '<blink>{{a}} {{{a}}}</blink>' }, { a: '<b>Hi</b>' })
    expect(output).toStrictEqual('<blink>&lt;b&gt;Hi&lt;&#x2F;b&gt; <b>Hi</b></blink>')
  })

  test('missing fields', () => {
    const output = transform({ '@template': '{{oops.yo}}' }, {})
    expect(output).toStrictEqual('')
  })
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
