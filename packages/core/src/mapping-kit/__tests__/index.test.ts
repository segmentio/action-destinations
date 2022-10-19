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

describe('@literal', () => {
  test('simple', () => {
    const output = transform({ simple: { '@literal': false } })
    expect(output).toStrictEqual({ simple: false })
  })

  test('nested directives', () => {
    const output = transform(
      {
        nested: {
          '@literal': {
            a: {
              '@path': '$.a'
            },
            b: {
              '@path': '$.b'
            }
          }
        }
      },
      {
        a: 'some value'
      }
    )

    expect(output).toStrictEqual({ nested: { a: 'some value' } })
  })
})

describe('@if', () => {
  const payload = { a: 1, b: true, c: false, d: null, e: '' }

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

    output = transform(
      {
        '@if': {
          exists: { '@path': '$.e' },
          then: 1,
          else: 2
        }
      },
      payload
    )
    expect(output).toStrictEqual(1)
  })

  test('blank', () => {
    let output = transform(
      {
        '@if': {
          blank: { '@path': '$.a' },
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
          blank: { '@path': '$.d' },
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
          blank: { '@path': '$.x' },
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
          blank: { '@path': '$.e' },
          then: 1,
          else: 2
        }
      },
      payload
    )
    expect(output).toStrictEqual(2)
  })
})

describe('@arrayPath', () => {
  const data = {
    products: [
      {
        productId: '123',
        price: 0.5
      },
      {
        productId: '456',
        price: 0.99
      }
    ]
  }

  test('simple', () => {
    const output = transform({ neat: { '@arrayPath': ['$.products'] } }, data)
    expect(output).toStrictEqual({ neat: data.products })
  })

  test('relative object shape', () => {
    const mapping = {
      neat: {
        '@arrayPath': [
          '$.products',
          {
            product_id: { '@path': '$.productId' },
            monies: { '@path': '$.price' }
          }
        ]
      }
    }

    const output = transform(mapping, data)
    expect(output).toStrictEqual({
      neat: [
        { product_id: '123', monies: 0.5 },
        { product_id: '456', monies: 0.99 }
      ]
    })
  })

  test('relative object shape with directive', () => {
    const mapping = {
      neat: {
        '@arrayPath': [
          {
            '@if': {
              exists: { '@path': '$.products' },
              then: { '@path': '$.products' },
              else: []
            }
          },
          {
            product_id: { '@path': '$.productId' },
            monies: { '@path': '$.price' }
          }
        ]
      }
    }

    const output = transform(mapping, data)
    expect(output).toStrictEqual({
      neat: [
        { product_id: '123', monies: 0.5 },
        { product_id: '456', monies: 0.99 }
      ]
    })
  })

  test('not an array', () => {
    const mapping = {
      neat: {
        '@arrayPath': [
          '$.products',
          {
            product_id: { '@path': '$.productId' },
            monies: { '@path': '$.price' }
          }
        ]
      }
    }

    const output = transform(mapping, { products: { notAnArray: true } })
    expect(output).toStrictEqual({
      neat: [{}]
    })
  })

  test('singular objects', () => {
    const mapping = {
      neat: {
        '@arrayPath': [
          '$.properties',
          {
            product_id: { '@path': '$.productId' },
            monies: { '@path': '$.price' }
          }
        ]
      }
    }

    const output = transform(mapping, {
      properties: {
        productId: '123',
        price: 0.5
      }
    })

    expect(output).toStrictEqual({
      neat: [{ product_id: '123', monies: 0.5 }]
    })
  })
})

describe('@path', () => {
  test('simple', () => {
    const output = transform({ neat: { '@path': '$.foo' } }, { foo: 'bar' })
    expect(output).toStrictEqual({ neat: 'bar' })
  })

  test('root path', () => {
    const obj = { foo: 'bar' }
    expect(transform({ '@path': '' }, obj)).toStrictEqual(obj)
    expect(transform({ '@path': '$.' }, obj)).toStrictEqual(obj)
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

  test('spaced nested value', () => {
    const output = transform(
      { neat: { '@path': '$.integrations.Actions Amplitude.session_id' } },
      {
        integrations: {
          'Actions Amplitude': {
            session_id: 'bar'
          }
        }
      }
    )
    expect(output).toStrictEqual({ neat: 'bar' })
  })

  test('invalid bracket-spaced nested value', () => {
    const output = transform(
      { neat: { '@path': "$.integrations['Actions Amplitude'].session_id" } },
      {
        integrations: {
          'Actions Amplitude': {
            session_id: 'bar'
          }
        }
      }
    )
    expect(output).toStrictEqual({})
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

  test('escaping', () => {
    const output = transform({ '@template': '<blink>{{a}} {{{a}}}</blink>' }, { a: '<b>Hi</b>' })
    expect(output).toStrictEqual('<blink>&lt;b&gt;Hi&lt;&#x2F;b&gt; <b>Hi</b></blink>')
  })

  test('no escaping if flag is on', () => {
    const output = transform(
      { '@template': '<blink>{{a}} {{{a}}}</blink>' },
      { a: '<b>Hi</b>' },
      { actionsEscapeOff: true }
    )
    expect(output).toStrictEqual('<blink><b>Hi</b> <b>Hi</b></blink>')
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
