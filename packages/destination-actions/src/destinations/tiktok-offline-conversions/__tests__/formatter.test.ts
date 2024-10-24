import { formatEmails, formatPhones } from '../formatter'

describe('Tiktok Offline Conversions Formatter', () => {
  describe('formatEmails', () => {
    it('should hash and encode email addresses', () => {
      const emails = ['bugsbunny@warnerbros.com', 'daffyduck@warnerbros.com']
      const result = formatEmails(emails)
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
      const result = formatEmails(emails)
      expect(result).toEqual(emails)
    })
  })

  describe('formatPhones', () => {
    it('should hash and encode phone numbers', () => {
      const phones = ['12345678901234', '98765432109876']
      const result = formatPhones(phones)
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
      const result = formatPhones(phones)
      expect(result).toEqual(phones)
    })
  })
})
