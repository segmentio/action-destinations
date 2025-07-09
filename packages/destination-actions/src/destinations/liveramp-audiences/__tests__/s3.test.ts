import { isValidS3BucketName } from '../audienceEnteredS3/s3'

describe('isValidS3BucketName', () => {
  describe('valid bucket names', () => {
    it('should return true for valid bucket names', () => {
      const validNames = [
        'my-bucket',
        'mybucket123',
        'my.bucket.name',
        'abc',
        'test-bucket-123',
        'bucket.with.dots',
        'a1b2c3',
        'bucket-name-with-hyphens',
        'bucket.name.with.dots',
        'my-bucket-123.test',
        'validbucketname123'
      ]

      validNames.forEach((name) => {
        expect(isValidS3BucketName(name)).toBe(true)
      })
    })
  })

  describe('invalid bucket names - length constraints', () => {
    it('should return false for bucket names that are too short', () => {
      expect(isValidS3BucketName('ab')).toBe(false)
      expect(isValidS3BucketName('a')).toBe(false)
      expect(isValidS3BucketName('')).toBe(false)
    })

    it('should return false for bucket names that are too long', () => {
      const longName = 'a'.repeat(64) // 64 characters, exceeds 63 limit
      expect(isValidS3BucketName(longName)).toBe(false)
    })
  })

  describe('invalid bucket names - character constraints', () => {
    it('should return false for bucket names with uppercase letters', () => {
      expect(isValidS3BucketName('MyBucket')).toBe(false)
      expect(isValidS3BucketName('BUCKET')).toBe(false)
      expect(isValidS3BucketName('Test-Bucket')).toBe(false)
    })

    it('should return false for bucket names with invalid characters', () => {
      expect(isValidS3BucketName('my_bucket')).toBe(false) // underscore
      expect(isValidS3BucketName('my bucket')).toBe(false) // space
      expect(isValidS3BucketName('my@bucket')).toBe(false) // @ symbol
      expect(isValidS3BucketName('my#bucket')).toBe(false) // # symbol
      expect(isValidS3BucketName('my$bucket')).toBe(false) // $ symbol
      expect(isValidS3BucketName('my%bucket')).toBe(false) // % symbol
      expect(isValidS3BucketName('my&bucket')).toBe(false) // & symbol
      expect(isValidS3BucketName('my*bucket')).toBe(false) // * symbol
      expect(isValidS3BucketName('my+bucket')).toBe(false) // + symbol
      expect(isValidS3BucketName('my=bucket')).toBe(false) // = symbol
      expect(isValidS3BucketName('my\\bucket')).toBe(false) // backslash
      expect(isValidS3BucketName('my/bucket')).toBe(false) // forward slash
    })
  })

  describe('invalid bucket names - begin/end constraints', () => {
    it('should return false for bucket names that start with invalid characters', () => {
      expect(isValidS3BucketName('.bucket')).toBe(false)
      expect(isValidS3BucketName('-bucket')).toBe(false)
      expect(isValidS3BucketName('.my-bucket')).toBe(false)
      expect(isValidS3BucketName('-my-bucket')).toBe(false)
    })

    it('should return false for bucket names that end with invalid characters', () => {
      expect(isValidS3BucketName('bucket.')).toBe(false)
      expect(isValidS3BucketName('bucket-')).toBe(false)
      expect(isValidS3BucketName('my-bucket.')).toBe(false)
      expect(isValidS3BucketName('my-bucket-')).toBe(false)
    })
  })

  describe('invalid bucket names - consecutive periods', () => {
    it('should return false for bucket names with consecutive periods', () => {
      expect(isValidS3BucketName('my..bucket')).toBe(false)
      expect(isValidS3BucketName('bucket..name')).toBe(false)
      expect(isValidS3BucketName('my...bucket')).toBe(false)
      expect(isValidS3BucketName('a..b')).toBe(false)
    })
  })

  describe('invalid bucket names - IP address format', () => {
    it('should return false for bucket names formatted as IP addresses', () => {
      expect(isValidS3BucketName('192.168.1.1')).toBe(false)
      expect(isValidS3BucketName('10.0.0.1')).toBe(false)
      expect(isValidS3BucketName('172.16.0.1')).toBe(false)
      expect(isValidS3BucketName('255.255.255.255')).toBe(false)
      expect(isValidS3BucketName('0.0.0.0')).toBe(false)
    })

    it('should return false for bucket names that look like IP addresses (even invalid ones)', () => {
      expect(isValidS3BucketName('192.168.1.300')).toBe(false) // 300 > 255, but still IP-like
      expect(isValidS3BucketName('999.999.999.999')).toBe(false) // invalid IP but IP-like format
      expect(isValidS3BucketName('123.456.789.012')).toBe(false) // invalid numbers but IP-like format
      expect(isValidS3BucketName('1.2.3.4')).toBe(false) // valid IP format
      expect(isValidS3BucketName('001.002.003.004')).toBe(false) // leading zeros, still IP-like
    })

    it('should return true for non-IP-like names with dots and numbers', () => {
      expect(isValidS3BucketName('192.168.1')).toBe(true) // incomplete IP (only 3 parts)
      expect(isValidS3BucketName('192.168.1.1.1')).toBe(true) // too many octets (5 parts)
      expect(isValidS3BucketName('bucket.123.name')).toBe(true) // clearly not IP format
      expect(isValidS3BucketName('v1.2.3')).toBe(true) // version-like, not IP
      expect(isValidS3BucketName('file.123')).toBe(true) // only 2 parts
      expect(isValidS3BucketName('a.b.c.d')).toBe(true) // 4 parts but contains letters
      expect(isValidS3BucketName('my-bucket.123.test')).toBe(true) // contains hyphens
    })
  })

  describe('invalid bucket names - forbidden prefixes', () => {
    it('should return false for bucket names with forbidden prefixes', () => {
      expect(isValidS3BucketName('xn--bucket')).toBe(false)
      expect(isValidS3BucketName('sthree-bucket')).toBe(false)
      expect(isValidS3BucketName('amzn-s3-demo-bucket')).toBe(false)
      expect(isValidS3BucketName('xn--test')).toBe(false)
      expect(isValidS3BucketName('sthree-test123')).toBe(false)
      expect(isValidS3BucketName('amzn-s3-demo-test')).toBe(false)
    })
  })

  describe('invalid bucket names - forbidden suffixes', () => {
    it('should return false for bucket names with forbidden suffixes', () => {
      expect(isValidS3BucketName('bucket-s3alias')).toBe(false)
      expect(isValidS3BucketName('bucket--ol-s3')).toBe(false)
      expect(isValidS3BucketName('bucket.mrap')).toBe(false)
      expect(isValidS3BucketName('bucket--x-s3')).toBe(false)
      expect(isValidS3BucketName('bucket--table-s3')).toBe(false)
      expect(isValidS3BucketName('my-bucket-s3alias')).toBe(false)
      expect(isValidS3BucketName('test--ol-s3')).toBe(false)
      expect(isValidS3BucketName('example.mrap')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle exact length limits', () => {
      const minValidName = 'abc' // 3 characters (minimum)
      const maxValidName = 'a'.repeat(63) // 63 characters (maximum)

      expect(isValidS3BucketName(minValidName)).toBe(true)
      expect(isValidS3BucketName(maxValidName)).toBe(true)
    })

    it('should handle single character begin/end cases', () => {
      expect(isValidS3BucketName('a')).toBe(false) // too short but would be valid otherwise
      expect(isValidS3BucketName('a1a')).toBe(true) // minimum valid case
      expect(isValidS3BucketName('1a1')).toBe(true) // numbers at begin/end
    })
  })
})
