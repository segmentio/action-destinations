import { sha256Hash } from '../functions'

describe('SHA256 Hashing', () => {
  describe('sha256Hash', () => {
    it('should correctly hash an email address', async () => {
      const input = 'test@example.com'
      const expected = '973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash a simple string', async () => {
      const input = 'hello'
      const expected = '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash a phone number (digits only)', async () => {
      const input = '14155551234'
      const expected = 'c6a349dfaaf5c3a368d3135014cc1bc7aebf18f654f313f9c1d0b018a897b209'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash a first name', async () => {
      const input = 'john'
      const expected = '96d9632f363564cc3032521409cf22a852f2032eec099ed5967c0d000cec607a'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash a last name', async () => {
      const input = 'doe'
      const expected = '799ef92a11af918e3fb741df42934f3b568ed2d93ac1df74f1b8d41a27932a6f'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash a gender value', async () => {
      const input = 'm'
      const expected = '62c66a7a5dd70c3146618063c344e531e6d4b59e379808443ce962b3abd63c5a'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash a city name (normalized)', async () => {
      const input = 'newyork'
      const expected = '350c754ba4d38897693aa077ef43072a859d23f613443133fecbbd90a3512ca5'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash a date of birth (YYYYMMDD format)', async () => {
      const input = '19900115'
      const expected = '4747c382bedef489a190a6797e6f4451907b86511bdd49cfa8f9d4c1a78d8bac'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should correctly hash numeric strings', async () => {
      const input = '1234567890'
      const expected = 'c775e7b757ede630cd0aa1113bd102661ab38829ca52a6422ab782862f268646'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })

    it('should return a 64-character hex string', async () => {
      const input = 'test'

      const result = await sha256Hash(input)

      expect(result).toHaveLength(64)
      expect(result).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should produce different hashes for different inputs', async () => {
      const input1 = 'test1'
      const input2 = 'test2'

      const result1 = await sha256Hash(input1)
      const result2 = await sha256Hash(input2)

      expect(result1).not.toBe(result2)
    })

    it('should produce the same hash for the same input', async () => {
      const input = 'consistent'

      const result1 = await sha256Hash(input)
      const result2 = await sha256Hash(input)

      expect(result1).toBe(result2)
    })

    it('should handle empty string', async () => {
      const input = ''
      const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

      const result = await sha256Hash(input)

      expect(result).toBe(expected)
    })
  })
})
