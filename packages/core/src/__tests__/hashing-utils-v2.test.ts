import { SmartHashing, processHashing, EncryptionMethods, DigestTypes, hashConfigs } from '../hashing-utils-v2'

describe('SmartHashing', () => {
  it('should hash a value using SHA256 and HEX by default', () => {
    const smartHashing = new SmartHashing()
    const value = 'test'
    const hashedValue = smartHashing.hash(value)
    expect(hashedValue).toHaveLength(64)
  })

  it('should hash a value using MD5 and BASE64', () => {
    const smartHashing = new SmartHashing('md5', 'base64')
    const value = 'test'
    const hashedValue = smartHashing.hash(value)
    expect(hashedValue).toHaveLength(24)
  })

  it('should return the value if it is already hashed', () => {
    const smartHashing = new SmartHashing()
    const value = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    expect(smartHashing.isAlreadyHashed(value)).toBe(true)
    expect(smartHashing.hash(value)).toBe(value)
  })

  it('should throw an error if the value is an empty string', () => {
    const smartHashing = new SmartHashing()
    expect(() => smartHashing.hash('')).toThrow('Cannot hash an empty string')
  })

  // Generate tests for every permutation of encryption methods and digest types
  EncryptionMethods.forEach((encryptionMethod) => {
    DigestTypes.forEach((digestType) => {
      it(`should hash a value using ${encryptionMethod} and ${digestType}`, () => {
        const smartHashing = new SmartHashing(encryptionMethod, digestType)
        const value = 'test'
        const hashedValue = smartHashing.hash(value)
        const expectedLength = hashConfigs[encryptionMethod][digestType === 'hex' ? 'lengthHex' : 'lengthBase64']
        expect(hashedValue).toHaveLength(expectedLength)
      })
    })
  })
})

describe('processHashing', () => {
  it('should process hashing with default settings', () => {
    const value = 'test'
    const hashedValue = processHashing(value, 'sha256', 'hex')
    expect(hashedValue).toHaveLength(64)
  })

  it('should process hashing with a cleaning function', () => {
    const value = ' test '
    const cleaningFunction = (val: string) => val.trim()
    const hashedValue = processHashing(value, 'sha256', 'hex', cleaningFunction)
    expect(hashedValue).toHaveLength(64)
  })

  it('should return the value if it is already hashed', () => {
    const value = '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'
    const hashedValue = processHashing(value, 'sha256', 'hex')
    expect(hashedValue).toBe(value)
  })

  it('should return an empty string if the value is an empty string', () => {
    const hashedValue = processHashing('', 'sha256', 'hex')
    expect(hashedValue).toBe('')
  })
})
