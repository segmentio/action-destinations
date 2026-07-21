import { formatEmails, formatPhones, formatAdvertisingId } from '../reportAppEvent/formatter'

describe('Tiktok Conversions Formatter', () => {
  describe('formatEmails', () => {
    it('should hash and encode email addresses', () => {
      const emails = ['bugsbunny@warnerbros.com', 'daffyduck@warnerbros.com']
      const result = formatEmails(emails, { 'smart-hashing': true })
      expect(result).toEqual([
        '67e28cdcc3e845d3a4da05ca9fe5ddb7320a83b4cc2167f0555a3b04f63511e3',
        '2d2fb2388f17f86affee71d632978425a3037fa8eed5b3f2baaa458c80d495ed'
      ])
    })

    it('should not hash and encode already hashed email addresses', () => {
      const emails = [
        '67e28cdcc3e845d3a4da05ca9fe5ddb7320a83b4cc2167f0555a3b04f63511e3',
        '2d2fb2388f17f86affee71d632978425a3037fa8eed5b3f2baaa458c80d495ed'
      ]
      const result = formatEmails(emails, { 'smart-hashing': true })
      expect(result).toEqual(emails)
    })
  })

  describe('formatPhones', () => {
    it('should hash and encode phone numbers', () => {
      const phones = ['12345678901234', '98765432109876']
      const result = formatPhones(phones, { 'smart-hashing': true })
      expect(result).toEqual([
        '00a63bd0437d6ca0fa7b95c00ab2e7c020faa71440e5246750d6b517689e6777',
        'ce7b12d132a021393e793d21d6e8e673ac06042922b73cc10f2d7db597657a4a'
      ])
    })

    it('should not hash and encode already hashed phone numbers', () => {
      const phones = [
        'c17c025fb9ed44eae8a9d5c9df0312af5c6161bd79bd669692364fc5ecaf108a',
        '5a1b78d720b151af8e69fde486784c1c279996813d20d23badbcce1e1037ee91'
      ]
      const result = formatPhones(phones, { 'smart-hashing': true })
      expect(result).toEqual(phones)
    })
  })

  describe('formatAdvertisingId', () => {
    it('should hash and encode iOS advertising IDs correctly by lowercasing it before hashing', () => {
      const result = formatAdvertisingId("7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB", true)
      expect(result).toEqual('08f1f8e9e433f685c514154e1a5b0dfe1885c6f140a7e3eff08a037bda13dcc1')
    })

    it('should hash and encode Android advertising IDs correctly', () => {
      const result = formatAdvertisingId("7A3CBEA0-BDF5-11E4-8DFC-AA07A5B093DB", false)
      expect(result).toEqual('d476ca08c0b93013e1dd2ca4d59b225c927355ce5bf6e0cfd222590a89c7dedb')
    })

    it('should not hash and encode already hashed advertising IDs', () => {
      const result = formatAdvertisingId("08f1f8e9e433f685c514154e1a5b0dfe1885c6f140a7e3eff08a037bda13dcc1", false)
      expect(result).toEqual('08f1f8e9e433f685c514154e1a5b0dfe1885c6f140a7e3eff08a037bda13dcc1')
    })
  })
})
