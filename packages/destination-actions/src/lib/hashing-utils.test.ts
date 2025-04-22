import { processHashing, EncryptionMethods, DigestTypes, hashConfigs } from './hashing-utils'

describe('processHashing', () => {
  const cleaningFunction = (val: string) => val.trim()
  let value = 'test'
  const hashed = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'

  it('should process hashing with default settings', () => {
    const hashedValue = processHashing(value, 'sha256', 'hex')
    expect(hashedValue).toBe(hashed)
    expect(hashedValue).toHaveLength(64)
  })

  it('should process hashing with a cleaning function', () => {
    value = ' test '
    const hashedValue = processHashing(value, 'sha256', 'hex', cleaningFunction)
    expect(hashedValue).toBe(hashed)
    expect(hashedValue).toHaveLength(64)
  })

  it('should process hashing with a lowercase cleaning function', () => {
    const lowercaseCleaningFunction = (val: string) => val.toLowerCase()
    value = 'TEST'
    const hashedValue = processHashing(value, 'sha256', 'hex', lowercaseCleaningFunction)
    expect(hashedValue).toBe(hashed)
    expect(hashedValue).toHaveLength(64)
  })

  it('should return the value if it is already hashed', () => {
    value = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    const hashedValue = processHashing(value, 'sha256', 'hex')
    expect(hashedValue).toBe(value)
  })

  it('should return an empty string if the value is an empty string', () => {
    const hashedValue = processHashing('', 'sha256', 'hex')
    expect(hashedValue).toBe('')
  })

  it('should clean and hash the value if feature flag is not set and cleaning function is provided', () => {
    value = ' test '
    const hashedValue = processHashing(value, 'sha256', 'hex', cleaningFunction)
    expect(hashedValue).toHaveLength(64)
  })

  // Tests for every permutation of encryption methods and digest types
  EncryptionMethods.forEach((encryptionMethod) => {
    DigestTypes.forEach((digestType) => {
      it(`should hash a value using ${encryptionMethod} and ${digestType}`, () => {
        const value = 'test'
        const hashedValue = processHashing(value, encryptionMethod, digestType)
        const expectedLength = hashConfigs[encryptionMethod][digestType === 'hex' ? 'lengthHex' : 'lengthBase64']
        expect(hashedValue).toHaveLength(expectedLength)
      })
    })
  })
})
