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
  u: undefined
}

const fixtures: Record<string, unknown> = {
  '': obj,
  a: obj.a,
  'a.b': obj.a.b,
  'a.b.c': obj.a.b.c,
  'a.b.d': obj.a.b.d,
  'a.b.e': obj.a.b.e,
  'a.b.f[0]': obj.a.b.f[0],
  'a.b.f[0].g': obj.a.b.f[0].g,
  'a.h': obj.a.h,
  'a.b.x': undefined,
  u: undefined
}

describe('get', () => {
  for (const path of Object.keys(fixtures)) {
    test(`"${path}"`, () => {
      expect(get(obj, path)).toEqual(fixtures[path])
    })
  }
})
