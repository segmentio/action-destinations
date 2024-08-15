import { sha256SmartHash, SmartHashing } from '../hashing-utils'

describe('hashing utilities', () => {
  it('should hash a non-hashed value', async () => {
    const value = 'test_value'

    expect(sha256SmartHash(value)).toEqual('4f7f6a4ae46676d9751fdccdf15ae1e6a200ed0de5653e06390148928c642006')
  })

  it('should not hash a hashed value', async () => {
    const value = '4f7f6a4ae46676d9751fdccdf15ae1e6a200ed0de5653e06390148928c642006'

    expect(sha256SmartHash(value)).toEqual(value)
  })
})

describe('SmarrtHashing', () => {
  it('should correctly check if a value is hashed or not', async () => {
    const hashed = '4f7f6a4ae46676d9751fdccdf15ae1e6a200ed0de5653e06390148928c642006'
    const notHashed = 'test_value'

    const smartHashing = new SmartHashing('sha256')

    expect(smartHashing.isAlreadyHashed(hashed)).toEqual(true)
    expect(smartHashing.isAlreadyHashed(notHashed)).toEqual(false)
  })

  it('should hash a non-hashed value', async () => {
    const notHashed = 'test_value'

    const smartHashing = new SmartHashing('sha256')
    smartHashing.isAlreadyHashed(notHashed)

    expect(smartHashing.hash(notHashed)).toEqual('4f7f6a4ae46676d9751fdccdf15ae1e6a200ed0de5653e06390148928c642006')
  })

  it('should not hash a hashed value', async () => {
    const hashed = '4f7f6a4ae46676d9751fdccdf15ae1e6a200ed0de5653e06390148928c642006'

    const smartHashing = new SmartHashing('sha256')
    smartHashing.isAlreadyHashed(hashed)

    expect(smartHashing.hash(hashed)).toEqual(hashed)
  })
})
