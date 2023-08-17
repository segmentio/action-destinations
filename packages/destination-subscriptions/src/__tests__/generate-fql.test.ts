import { generateFql, Subscription } from '../index'

test('should handle error in ast', () => {
  const ast = {
    error: new Error("Cannot read property 'type' of undefined")
  }
  try {
    generateFql(ast)
    fail('should have thrown an error')
  } catch (error: unknown) {
    expect(error).toEqual(new Error("Cannot read property 'type' of undefined"))
  }
})

test('should handle valid ast', () => {
  const ast: Subscription = {
    type: 'group',
    operator: 'and',
    children: [
      {
        type: 'event-property',
        name: 'value',
        operator: '=',
        value: 'x'
      }
    ]
  }

  expect(generateFql(ast)).toEqual('properties.value = "x"')
})

test('should handle ast with multiple childs (or condition)', () => {
  const ast: Subscription = {
    type: 'group',
    operator: 'or',
    children: [
      {
        type: 'event-type',
        operator: '=',
        value: 'track'
      },
      {
        type: 'event-type',
        operator: '=',
        value: 'identify'
      },
      {
        type: 'userId',
        operator: 'exists'
      }
    ]
  }

  expect(generateFql(ast)).toEqual('type = "track" or type = "identify" or userId != null')
})

test('should handle ast with multiple childs (and condition)', () => {
  const ast: Subscription = {
    type: 'group',
    operator: 'and',
    children: [
      {
        type: 'event',
        operator: '=',
        value: 'Page Viewed'
      },
      {
        type: 'event-property',
        name: 'name',
        operator: '=',
        value: 'Catalog'
      }
    ]
  }

  expect(generateFql(ast)).toEqual('event = "Page Viewed" and properties.name = "Catalog"')
})

test('should handle field paths with non-regular values and escape properly', () => {
  const ast: Subscription = {
    type: 'group',
    operator: 'and',
    children: [
      {
        type: 'event',
        operator: '=',
        value: 'Page Viewed'
      },
      {
        type: 'event-property',
        name: 'property 1',
        operator: '=',
        value: 'Catalog'
      },
      {
        type: 'event-trait',
        name: 'property dos',
        operator: '=',
        value: 2
      }
    ]
  }

  expect(generateFql(ast)).toEqual(
    'event = "Page Viewed" and properties.property\\ 1 = "Catalog" and traits.property\\ dos = 2'
  )
})

test('should handle ast with nested childs', () => {
  const ast: Subscription = {
    type: 'group',
    operator: 'and',
    children: [
      {
        type: 'event-type',
        operator: '=',
        value: 'track'
      },
      {
        type: 'group',
        operator: 'or',
        children: [
          {
            type: 'event',
            operator: '=',
            value: 'Page Viewed'
          },
          {
            type: 'event',
            operator: '=',
            value: 'Order Completed'
          }
        ]
      }
    ]
  }

  expect(generateFql(ast)).toEqual('type = "track" and (event = "Page Viewed" or event = "Order Completed")')
})

test('should handle ast with nested (dot-delimited) properties', () => {
  const ast: Subscription = {
    type: 'group',
    operator: 'and',
    children: [
      {
        type: 'event-property',
        name: 'foo.bar.baz',
        operator: '=',
        value: 'hello'
      }
    ]
  }

  expect(generateFql(ast)).toEqual('properties.foo.bar.baz = "hello"')
})

test('should handle ast with nested (dot-delimited) and irregular properties', () => {
  const ast: Subscription = {
    type: 'group',
    operator: 'and',
    children: [
      {
        type: 'event-property',
        name: 'foo.bar.baz alp.zaz',
        operator: '=',
        value: 'hello'
      }
    ]
  }

  expect(generateFql(ast)).toEqual('properties.foo.bar.baz\\ alp.zaz = "hello"')
})
