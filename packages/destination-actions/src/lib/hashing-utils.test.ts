import { processHashing, EncryptionMethods, DigestTypes, hashConfigs } from './hashing-utils'

describe('processHashing', () => {
  const cleaningFunction = (val: string) => val.trim()
  let features = { 'smart-hashing': true }
  let value = 'test'
  let hashed = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
  const slugForBypass = 'actions-facebook-custom-audiences'

  it('should process hashing with default settings', () => {
    const hashedValue = processHashing(value, 'sha256', 'hex', features, '')
    expect(hashedValue).toBe(hashed)
    expect(hashedValue).toHaveLength(64)
  })

  it('should process hashing with a cleaning function', () => {
    value = ' test '
    const hashedValue = processHashing(value, 'sha256', 'hex', features, '', cleaningFunction)
    expect(hashedValue).toBe(hashed)
    expect(hashedValue).toHaveLength(64)
  })

  it('should return the value if it is already hashed', () => {
    value = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    const hashedValue = processHashing(value, 'sha256', 'hex', features, '')
    expect(hashedValue).toBe(value)
  })

  it('should return an empty string if the value is an empty string', () => {
    const hashedValue = processHashing('', 'sha256', 'hex', features, '')
    expect(hashedValue).toBe('')
  })

  it('should clean and hash the value if feature flag is not set and cleaning function is provided', () => {
    features = { 'smart-hashing': false }
    value = ' test '
    const hashedValue = processHashing(value, 'sha256', 'hex', features, '', cleaningFunction)
    expect(hashedValue).toHaveLength(64)
  })

  it('should double hash the hashed value if feature flag is not set', () => {
    features = { 'smart-hashing': false }
    value = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    hashed = '7b3d979ca8330a94fa7e9e1b466d8b99e0bcdea1ec90596c0dcc8d7ef6b4300c'
    const hashedValue = processHashing(value, 'sha256', 'hex', features, '')
    expect(hashedValue).toBe(hashed)
  })

  it('should bypass the feature flag if slug is in slugsToBypassFeatureFlag', () => {
    value = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    const hashedValue = processHashing(value, 'sha256', 'hex', features, slugForBypass, cleaningFunction)
    expect(hashedValue).toBe(value)
    expect(hashedValue).toHaveLength(64)
  })

  // Tests for every permutation of encryption methods and digest types
  EncryptionMethods.forEach((encryptionMethod) => {
    DigestTypes.forEach((digestType) => {
      it(`should hash a value using ${encryptionMethod} and ${digestType}`, () => {
        const value = 'test'
        const hashedValue = processHashing(value, encryptionMethod, digestType, features, '')
        const expectedLength = hashConfigs[encryptionMethod][digestType === 'hex' ? 'lengthHex' : 'lengthBase64']
        expect(hashedValue).toHaveLength(expectedLength)
      })
    })
  })
})
