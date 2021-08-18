import { removeUnknownKeys } from '../remove-unknown-keys'

const obj = {
  a: 'hello',
  b: true,
  c: {
    d: {}
  },
  e: undefined
}

describe('removeUnknownKeys', () => {
  it('should remove any keys that are not specified', () => {
    const keys = ['a', 'c', 'e']
    const result = removeUnknownKeys(obj, keys)
    expect(result).not.toHaveProperty('b')
    expect(result).toMatchInlineSnapshot(`
      Object {
        "a": "hello",
        "c": Object {
          "d": Object {},
        },
        "e": undefined,
      }
    `)
  })
})
