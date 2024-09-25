import { flattenObject } from '../flatten'

describe('flatten', () => {
  it('flattens an object', () => {
    const obj = {
      a: {
        b: {
          c: 1
        },
        d: 2
      }
    }
    expect(flattenObject(obj)).toEqual({
      'a.b.c': 1,
      'a.d': 2
    })
  })
  it('flattens an object with a custom separator', () => {
    const obj = {
      a: {
        b: {
          c: 1
        },
        d: 2
      }
    }
    expect(flattenObject(obj, '', '/')).toEqual({
      'a/b/c': 1,
      'a/d': 2
    })
  })
  it('flattens an array', () => {
    const obj = {
      a: [
        {
          b: 1
        },
        {
          c: 2
        }
      ]
    }
    expect(flattenObject(obj)).toEqual({
      'a.0.b': 1,
      'a.1.c': 2
    })
  })
  it('flattens a deep nested structure', () => {
    const obj = {
      a: {
        b: {
          c: {
            d: {
              e: {
                f: {
                  g: {
                    h: {
                      i: 1
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    expect(flattenObject(obj)).toEqual({
      'a.b.c.d.e.f.g.h.i': 1
    })
  })
  it('flattens a deep nested structure with deep nested arrays', () => {
    const obj = {
      a: {
        b: {
          c: [
            {
              d: [
                {
                  e: [
                    {
                      f: [
                        {
                          g: [
                            {
                              h: [
                                {
                                  i: 1
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      }
    }
    expect(flattenObject(obj)).toEqual({
      'a.b.c.0.d.0.e.0.f.0.g.0.h.0.i': 1
    })
  })
  it('flattens a structure starting with arrays of objects', () => {
    const obj = [
      {
        a: [
          {
            b: [
              {
                c: 1
              }
            ]
          },
          {
            d: [
              {
                e: 2
              }
            ]
          }
        ]
      }
    ]
    expect(flattenObject(obj)).toEqual({
      '0.a.0.b.0.c': 1,
      '0.a.1.d.0.e': 2
    })
  })

  it('does not flatten arrays when omitArrays is passed', () => {
    const obj = {
      a: {
        b: {
          c: [
            {
              d: [
                {
                  e: 1
                }
              ]
            }
          ]
        }
      }
    }
    expect(flattenObject(obj, undefined, '.', true)).toEqual({
      'a.b.c': [
        {
          d: [
            {
              e: 1
            }
          ]
        }
      ]
    })
  })
})
