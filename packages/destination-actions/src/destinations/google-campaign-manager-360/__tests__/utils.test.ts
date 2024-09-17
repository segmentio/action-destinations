import { maybeHash } from '../utils'

describe('maybeHash()', () => {
  it('should hash the string', () => {
    expect(maybeHash('my string')).toEqual('2f7e2089add0288a309abd71ffcc3b3567e2d4215e20e6ed3b74d6042f7ef8e5')
  })

  it('should hash the string, undefined', () => {
    expect(maybeHash(undefined)).toEqual(undefined)
  })
})
