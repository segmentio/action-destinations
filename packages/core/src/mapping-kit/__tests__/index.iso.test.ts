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

describe('@case', () => {
  const payload = {
    a: 1,
    b: 'MAKE ME LOWER CASE',
    c: 'make me upper case',
    d: null,
    e: '',
    f: false,
    g: 'mIXeD StRinG CasING W/ NuMBErs 190wdB',
    h: { key1: 'with values', key2: ['hi', true, null] }
  }

  test('handle string-input transformations by performing correct operation', () => {
    let output = transform(
      {
        '@case': {
          operator: 'lower',
          value: { '@path': '$.b' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('make me lower case')

    output = transform(
      {
        '@case': {
          operator: 'upper',
          value: { '@path': '$.c' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('MAKE ME UPPER CASE')

    output = transform(
      {
        '@case': {
          operator: 'lower',
          value: { '@path': '$.e' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('')

    output = transform(
      {
        '@case': {
          operator: 'lower',
          value: { '@path': '$.g' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('mixed string casing w/ numbers 190wdb')

    output = transform(
      {
        '@case': {
          operator: 'upper',
          value: { '@path': '$.g' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('MIXED STRING CASING W/ NUMBERS 190WDB')
  })

  test('handle non-string-input correctly by returning the given value unmodified', () => {
    let output = transform(
      {
        '@case': {
          operator: 'lower',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual(1)

    output = transform(
      {
        '@case': {
          operator: 'lower',
          value: { '@path': '$.d' }
        }
      },
      payload
    )
    expect(output).toStrictEqual(null)

    output = transform(
      {
        '@case': {
          operator: 'lower',
          value: { '@path': '$.f' }
        }
      },
      payload
    )
    expect(output).toStrictEqual(false)

    output = transform(
      {
        '@case': {
          operator: 'lower',
          value: { '@path': '$.h' }
        }
      },
      payload
    )
    expect(output).toStrictEqual({ key1: 'with values', key2: ['hi', true, null] })
  })

  test('Throw errors when directive is not setup correctly', () => {
    let test = () => {
      transform(
        {
          '@case': {
            wrongKey: 'lower',
            value: { '@path': '$.b' }
          }
        },
        payload
      )
    }

    expect(test).toThrow(Error)
    expect(test).toThrow('@case requires a "operator" key')

    test = () =>
      transform(
        {
          '@case': {
            operator: 'unsupported snake',
            value: { '@path': '$.b' }
          }
        },
        payload
      )
    expect(test).toThrow(Error)
    expect(test).toThrow('operator key should have a value of "lower" or "upper"')

    test = () =>
      transform(
        {
          '@case': 'not an object'
        },
        payload
      )
    expect(test).toThrow(Error)
    expect(test).toThrow('/@case should be an object but it is a string.')
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

describe('@json', () => {
  test('encode', () => {
    const output = transform({ neat: { '@json': { mode: 'encode', value: { '@path': '$.foo' } } } }, { foo: 'bar' })
    expect(output).toStrictEqual({ neat: '"bar"' })
  })

  test('encode_object', () => {
    const output = transform(
      { neat: { '@json': { mode: 'encode', value: { '@path': '$.foo' } } } },
      { foo: { bar: 'baz' } }
    )
    expect(output).toStrictEqual({ neat: '{"bar":"baz"}' })
  })

  test('encode_array', () => {
    const output = transform(
      { neat: { '@json': { mode: 'encode', value: { '@path': '$.foo' } } } },
      { foo: ['bar', 'baz'] }
    )
    expect(output).toStrictEqual({ neat: '["bar","baz"]' })
  })

  test('decode', () => {
    const output = transform({ neat: { '@json': { mode: 'decode', value: { '@path': '$.foo' } } } }, { foo: '"bar"' })
    expect(output).toStrictEqual({ neat: 'bar' })
  })

  test('decode_object', () => {
    const output = transform(
      { neat: { '@json': { mode: 'decode', value: { '@path': '$.foo' } } } },
      { foo: '{"bar":"baz"}' }
    )
    expect(output).toStrictEqual({ neat: { bar: 'baz' } })
  })

  test('decode_array', () => {
    const output = transform(
      { neat: { '@json': { mode: 'decode', value: { '@path': '$.foo' } } } },
      { foo: '["bar","baz"]' }
    )
    expect(output).toStrictEqual({ neat: ['bar', 'baz'] })
  })

  test('invalid mode', () => {
    expect(() => {
      transform({ neat: { '@json': { mode: 'oops', value: { '@path': '$.foo' } } } }, { foo: 'bar' })
    }).toThrowError()
  })

  test('invalid value', () => {
    const output = transform(
      { neat: { '@json': { mode: 'encode', value: { '@path': '$.bad' } } } },
      { foo: { bar: 'baz' } }
    )
    expect(output).toStrictEqual({})
  })
})

describe('@flatten', () => {
  test('simple', () => {
    const output = transform(
      { neat: { '@flatten': { value: { '@path': '$.foo' }, separator: '.' } } },
      { foo: { bar: 'baz', aces: { a: 1, b: 2 } } }
    )
    expect(output).toStrictEqual({ neat: { bar: 'baz', 'aces.a': 1, 'aces.b': 2 } })
  })
  test('array value first', () => {
    const output = transform(
      { result: { '@flatten': { value: { '@path': '$.foo' }, separator: '.' } } },
      { foo: [{ fazz: 'bar', fizz: 'baz' }] }
    )
    expect(output).toStrictEqual({ result: { '0.fazz': 'bar', '0.fizz': 'baz' } })
  })

  test('omitArrays passed', () => {
    const output = transform(
      { neat: { '@flatten': { value: { '@path': '$.foo' }, separator: '.', omitArrays: true } } },
      { foo: { bar: 'baz', aces: [1, 2] } }
    )
    expect(output).toStrictEqual({ neat: { bar: 'baz', aces: [1, 2] } })
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
    expect(output).toStrictEqual('<blink><b>Hi</b> <b>Hi</b></blink>')
  })

  test('missing fields', () => {
    const output = transform({ '@template': '{{oops.yo}}' }, {})
    expect(output).toStrictEqual('')
  })
})

describe('@replace', () => {
  test('replace on empty string', () => {
    const payload = {
      a: ''
    }
    const output = transform(
      {
        '@replace': {
          pattern: '_',
          replacement: 'rrrrr',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('')
  })
  test('replace on null string', () => {
    const payload = {
      a: null
    }
    const output = transform(
      {
        '@replace': {
          pattern: '_',
          replacement: 'rrrrr',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('')
  })
  test('replace on case sensitive string', () => {
    const payload = {
      a: 'cWWl-story-ww'
    }
    const output = transform(
      {
        '@replace': {
          pattern: 'WW',
          replacement: 'oo',
          value: { '@path': '$.a' },
          ignorecase: false // true by default but just showing here
        }
      },
      payload
    )
    expect(output).toStrictEqual('cool-story-ww')
  })
  test('replace on case insensitive string', () => {
    const payload = {
      a: 'aab-----AaB---aab'
    }
    const output = transform(
      {
        '@replace': {
          pattern: 'AaB',
          replacement: 'nice',
          value: { '@path': '$.a' },
          ignorecase: true
        }
      },
      payload
    )
    expect(output).toStrictEqual('nice-----nice---nice')
  })
  test('replace with empty string', () => {
    const payload = {
      a: 'nomore_underscore'
    }
    const output = transform(
      {
        '@replace': {
          pattern: '_',
          replacement: '',
          value: { '@path': '$.a' },
          ignorecase: false
        }
      },
      payload
    )
    expect(output).toStrictEqual('nomoreunderscore')
  })
  test('replace with non-empty string', () => {
    const payload = {
      a: 'nomore_underscore'
    }
    const output = transform(
      {
        '@replace': {
          pattern: '_',
          replacement: 'weird',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('nomoreweirdunderscore')
  })
  test('replace multi-char pattern with non-empty string', () => {
    const payload = {
      a: 'Well Hello there LOL'
    }
    const output = transform(
      {
        '@replace': {
          pattern: 'LOL',
          replacement: 'YAY',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('Well Hello there YAY')
  })
  test('replace multiple occurrences', () => {
    const payload = {
      a: 'many+different+things'
    }
    const output = transform(
      {
        '@replace': {
          pattern: '+',
          replacement: '_',
          value: { '@path': '$.a' },
          global: true // true by default but just to demo
        }
      },
      payload
    )
    expect(output).toStrictEqual('many_different_things')
  })
  test('replace first occurrence', () => {
    const payload = {
      a: 'many+different+things'
    }
    const output = transform(
      {
        '@replace': {
          pattern: '+',
          replacement: '_',
          value: { '@path': '$.a' },
          global: false // true by default but just to demo
        }
      },
      payload
    )
    expect(output).toStrictEqual('many_different+things')
  })
  test('replace entire value', () => {
    const payload = {
      a: 'aaabbbcccd'
    }
    const output = transform(
      {
        '@replace': {
          pattern: 'aaabbbcccd',
          replacement: '',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('')
  })
  test('should still work without replacement key', () => {
    const payload = {
      a: 'many+different+things'
    }
    const output = transform(
      {
        '@replace': {
          pattern: 'many+',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('different+things')
  })
  test('replace boolean', () => {
    const payload = {
      a: true
    }
    const output = transform(
      {
        '@replace': {
          pattern: 'true',
          replacement: 'granted',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('granted')
  })
  test('replace number', () => {
    const payload = {
      a: 1
    }
    const output = transform(
      {
        '@replace': {
          pattern: '1',
          replacement: 'granted',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('granted')
  })
  test('replace 2 values', () => {
    const payload = {
      a: 'something-great!'
    }
    const output = transform(
      {
        '@replace': {
          pattern: '-',
          replacement: ' ',
          pattern2: 'great',
          replacement2: 'awesome',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('something awesome!')
  })
  test('replace with 2 values but only second one exists', () => {
    const payload = {
      a: false
    }
    const output = transform(
      {
        '@replace': {
          pattern: 'true',
          replacement: 'granted',
          pattern2: 'false',
          replacement2: 'denied',
          value: { '@path': '$.a' }
        }
      },
      payload
    )
    expect(output).toStrictEqual('denied')
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

describe('@merge', () => {
  // simple test cases that have the same output regardless of direction
  ;['left', 'right'].forEach((direction) => {
    test('empty', () => {
      const output = transform({ '@merge': { direction, objects: [] } }, {})
      expect(output).toStrictEqual({})
    })

    test('one object', () => {
      const output = transform({ '@merge': { direction, objects: [{ cool: true }] } }, {})
      expect(output).toStrictEqual({ cool: true })
    })

    test('invalid type', () => {
      expect(() => {
        transform({ '@merge': { direction, objects: { oops: true } } })
      }).toThrowError()
    })

    test('invalid nested type', () => {
      expect(() => {
        transform({ '@merge': { direction, objects: [{}, 1] } })
      }).toThrowError()
    })
  })

  test('invalid direction specified', () => {
    expect(() => {
      transform({ '@merge': { direction: 'up', objects: [{ oh: 'yeah' }, {}] } })
    }).toThrowError()
  })

  // expect a different output based on direction
  test('simple overwrite default direction', () => {
    const output = transform({ '@merge': { direction: 'right', objects: [{ cool: true }, { cool: 'you bet' }] } }, {})
    expect(output).toStrictEqual({ cool: 'you bet' })
  })

  test('nested directive default direction', () => {
    const output = transform(
      { '@merge': { direction: 'right', objects: [{ cool: true }, { '@path': 'foo' }] } },
      { foo: { bar: 'baz' } }
    )
    expect(output).toStrictEqual({ cool: true, bar: 'baz' })
  })

  test('nested directive with overwrite default direction', () => {
    const output = transform(
      { '@merge': { direction: 'right', objects: [{ cool: true, hey: 'there' }, { '@path': 'foo' }] } },
      { foo: { bar: 'baz', hey: 'you' } }
    )
    expect(output).toStrictEqual({ cool: true, bar: 'baz', hey: 'you' })
  })

  test('simple overwrite left direction', () => {
    const output = transform({ '@merge': { direction: 'left', objects: [{ cool: true }, { cool: 'you bet' }] } }, {})
    expect(output).toStrictEqual({ cool: true })
  })

  test('nested directive left direction', () => {
    const output = transform(
      { '@merge': { direction: 'left', objects: [{ cool: true }, { '@path': 'foo' }] } },
      { foo: { bar: 'baz' } }
    )
    expect(output).toStrictEqual({ cool: true, bar: 'baz' })
  })

  test('nested directive with overwrite left direction', () => {
    const output = transform(
      { '@merge': { direction: 'left', objects: [{ cool: true, hey: 'there' }, { '@path': 'foo' }] } },
      { foo: { bar: 'baz', hey: 'you' } }
    )
    expect(output).toStrictEqual({ cool: true, bar: 'baz', hey: 'there' })
  })
})

describe('@transform', () => {
  test('invalid key type', () => {
    expect(() => {
      transform({ '@transform': { '@path': {} } }, { foo: 'bar' })
    }).toThrowError()
  })
  test('simple', () => {
    const output = transform(
      {
        '@transform': {
          apply: {
            foo: {
              '@path': '$.a'
            }
          },
          mapping: {
            cool: { '@path': '$.foo' }
          }
        }
      },
      {
        a: 1,
        b: 2
      }
    )

    expect(output).toStrictEqual({ cool: 1 })
  })

  test('composed with other directives', () => {
    const output = transform(
      {
        '@transform': {
          apply: {
            properties: {
              '@flatten': {
                value: { '@path': '$.properties' },
                separator: '_'
              }
            }
          },
          mapping: {
            properties: { '@path': '$.properties' },
            topLevel: { '@path': '$.properties.nested_a' }
          }
        }
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

describe('@excludeWhenNull', () => {
  test('simple', () => {
    const output = transform(
      { someFieldToExclude: { '@excludeWhenNull': { '@path': '$.foo.bar' } } },
      { foo: { bar: null, aces: { a: 1, b: 2 } } }
    )
    expect(output).toStrictEqual({})
  })

  test('simple with multiple mappings', () => {
    const output = transform(
      {
        someFieldToExclude: { '@excludeWhenNull': { '@path': '$.foo.bar' } },
        anotherField: { '@path': '$.foo.aces.a' }
      },
      { foo: { bar: null, aces: { a: 1, b: 2 } } }
    )
    expect(output).toStrictEqual({ anotherField: 1 })
  })

  test('dont exclude individual null fields in object when applied at object level', () => {
    const output = transform(
      { neat: { '@excludeWhenNull': { '@path': '$.foo' } } },
      { foo: { bar: null, aces: { a: 1, b: 2 } } }
    )
    expect(output).toStrictEqual({ neat: { bar: null, aces: { a: 1, b: 2 } } })
  })

  test('exclude when resolved value is null using transform', () => {
    const output = transform(
      {
        empty: {
          '@transform': {
            apply: {
              properties: {
                '@excludeWhenNull': { '@path': '$.properties' }
              }
            },
            mapping: {
              properties: { '@path': '$.properties' },
              topLevel: { '@path': '$.properties.nested_a' }
            }
          }
        }
      },
      { foo: { bar: null, aces: { a: 1, b: 2 } } }
    )
    expect(output).toStrictEqual({ empty: {} })
  })

  test('composed with other directives', () => {
    // Note: doesnt make sense to test with
    // - transform: always returns non-null json object
    // - merge: always returns non-null json object
    // - flatten: always returns non-null json object
    // - arrayPath: always returns non-null json array
    const output = transform(
      {
        massive: {
          pathNull: { '@excludeWhenNull': { '@path': '$.foo.bar' } },
          templateEmpty: { '@excludeWhenNull': { '@template': '{{foo.bar}}' } },
          literalNull: { '@excludeWhenNull': { '@literal': null } },
          ifNull: { '@excludeWhenNull': { '@if': { exists: { '@path': '$.foo.foobar' }, then: 1, else: null } } },
          caseNull: { '@excludeWhenNull': { '@case': { operator: 'upper', value: { '@path': '$.foo.bar' } } } },
          replaceNull: {
            '@excludeWhenNull': { '@replace': { pattern: '-', replacement: 'nice', value: { '@path': '$.foo.bar' } } }
          },
          jsonNull: { '@excludeWhenNull': { '@json': { mode: 'decode', value: { '@path': '$.foo.bar' } } } },
          transformNull: {
            '@excludeWhenNull': {
              '@transform': {
                apply: { properties: { '@path': '$.foo.bar' } },
                mapping: { properties: { '@excludeWhenNull': { '@path': '$.properties' } } }
              }
            }
          },
          transformNull2: {
            '@excludeWhenNull': {
              '@transform': {
                apply: { properties: { '@excludeWhenNull': { '@path': '$.foo.bar' } } },
                mapping: { properties: { '@path': '$.properties' } }
              }
            }
          },
          // These are essentially no-ops bcos they always return non-null objects but good to exercise explicitly
          jsonNullEncode: { '@excludeWhenNull': { '@json': { mode: 'encode', value: { '@path': '$.foo.bar' } } } },
          transformValue: {
            '@excludeWhenNull': {
              '@transform': {
                apply: { properties: { '@path': '$.foo.bar' } },
                mapping: { properties: { '@path': '$.properties' } }
              }
            }
          }
        }
      },
      { foo: { bar: null, aces: { a: 1, b: 2 } } }
    )
    expect(output).toStrictEqual({
      massive: {
        templateEmpty: '',
        jsonNullEncode: 'null',
        replaceNull: '', // TODO possible that this is a bug in the replace directive and should return null and get excluded instead
        transformNull: {},
        transformNull2: {},
        transformValue: {
          properties: null
        }
      }
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
