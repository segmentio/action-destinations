import { mapUnits } from '../unit'

describe('mapUnits()', () => {
  it('should skip invalid units', async () => {
    const payload = {
      units: {
        anonymous_id: '477f0fc8-84d0-47f8-9c01-705245bf728d',
        email: null,
        device_id: ''
      }
    }

    const mapped = mapUnits(payload)
    expect(mapped).toEqual([{ type: 'anonymous_id', uid: '477f0fc8-84d0-47f8-9c01-705245bf728d' }])
  })

  it('should convert number to string', async () => {
    const payload = {
      units: {
        user_id: 123
      }
    }

    const mapped = mapUnits(payload)
    expect(mapped).toEqual([{ type: 'user_id', uid: '123' }])
  })
})
