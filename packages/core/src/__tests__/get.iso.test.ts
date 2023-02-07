import { get } from '../get'

const obj = {
  a: {
    b: {
      c: 42,
      d: true,
      e: 'hello',
      f: [{ g: 'yay' }, { g: 'nay' }]
    },
    h: null
  },
  u: undefined,
  '[txt] non': true,
  '[txt] nest': {
    inner: true
  }
}

// webkit does not support look behind ATM
const supportsLookBehind = (() => {
  try {
    new RegExp(`(?<=Y)`)
    return true
  } catch (e) {
    return false
  }
})()

const fixtures = new Map<any, any>([
  [undefined, undefined],
  [null, undefined],
  [['a', 'b'], obj.a.b],
  ['', obj],
  ['.', obj],
  ['a', obj.a],
  ['a.b', obj.a.b],
  ["['a'].b", obj.a.b],
  ['["a"].b', obj.a.b],
  ['a.b.c', obj.a.b.c],
  ['a.b.d', obj.a.b.d],
  ['a.b.e', obj.a.b.e],
  ['a.b.f[0]', obj.a.b.f[0]],
  ['a.b.f[0].g', obj.a.b.f[0].g],
  ['a.h', obj.a.h],
  ['a.b.x', undefined],
  ['u', undefined],
  ['[txt] non', supportsLookBehind ? true : undefined],
  ['[txt] nest.inner', supportsLookBehind ? true : undefined]
])

describe('get', () => {
  fixtures.forEach((expected, path) => {
    test(`"${path}"`, () => {
      expect(get(obj, path)).toEqual(expected)
    })
  })
})
