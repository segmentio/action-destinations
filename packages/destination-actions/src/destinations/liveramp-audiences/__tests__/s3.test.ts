import { isValidS3BucketName, isValidS3Path, normalizeS3Path } from '../audienceEnteredS3/s3'

describe('S3 Validation Functions', () => {
  describe('isValidS3BucketName', () => {
    it('should return true for valid bucket names', () => {
      expect(isValidS3BucketName('my-bucket')).toBe(true)
      expect(isValidS3BucketName('valid-bucket-name')).toBe(true)
      expect(isValidS3BucketName('bucket123')).toBe(true)
      expect(isValidS3BucketName('a.b.c')).toBe(true)
      expect(isValidS3BucketName('my-bucket.example')).toBe(true)
      expect(isValidS3BucketName('bucket-with-hyphens')).toBe(true)
      expect(isValidS3BucketName('123bucket')).toBe(true)
    })

    it('should return false for bucket names containing slashes', () => {
      expect(isValidS3BucketName('for-liveramp/folder01/folder_001/')).toBe(false)
      expect(isValidS3BucketName('bucket/with/slashes')).toBe(false)
      expect(isValidS3BucketName('bucket/path')).toBe(false)
      expect(isValidS3BucketName('/bucket')).toBe(false)
      expect(isValidS3BucketName('bucket/')).toBe(false)
    })

    it('should return false for bucket names that are too short', () => {
      expect(isValidS3BucketName('ab')).toBe(false)
      expect(isValidS3BucketName('a')).toBe(false)
      expect(isValidS3BucketName('')).toBe(false)
    })

    it('should return false for bucket names that are too long', () => {
      const longName = 'a'.repeat(64)
      expect(isValidS3BucketName(longName)).toBe(false)
    })

    it('should return false for bucket names with uppercase letters', () => {
      expect(isValidS3BucketName('MyBucket')).toBe(false)
      expect(isValidS3BucketName('BUCKET')).toBe(false)
      expect(isValidS3BucketName('bucketNAME')).toBe(false)
    })

    it('should return false for bucket names with forbidden characters', () => {
      expect(isValidS3BucketName('bucket with spaces')).toBe(false)
      expect(isValidS3BucketName('bucket_underscore')).toBe(false)
      expect(isValidS3BucketName('bucket\\name')).toBe(false)
      expect(isValidS3BucketName('bucket{name}')).toBe(false)
      expect(isValidS3BucketName('bucket[name]')).toBe(false)
      expect(isValidS3BucketName('bucket%name')).toBe(false)
      expect(isValidS3BucketName('bucket`name')).toBe(false)
      expect(isValidS3BucketName('bucket"name')).toBe(false)
      expect(isValidS3BucketName('bucket<name>')).toBe(false)
      expect(isValidS3BucketName('bucket#name')).toBe(false)
      expect(isValidS3BucketName('bucket|name')).toBe(false)
      expect(isValidS3BucketName('bucket~name')).toBe(false)
    })

    it('should return false for bucket names that do not begin and end with a letter or number', () => {
      expect(isValidS3BucketName('-bucket')).toBe(false)
      expect(isValidS3BucketName('bucket-')).toBe(false)
      expect(isValidS3BucketName('.bucket')).toBe(false)
      expect(isValidS3BucketName('bucket.')).toBe(false)
      expect(isValidS3BucketName('-bucket-')).toBe(false)
      expect(isValidS3BucketName('.bucket.')).toBe(false)
    })

    it('should return false for bucket names with two adjacent periods', () => {
      expect(isValidS3BucketName('bucket..name')).toBe(false)
      expect(isValidS3BucketName('my..bucket')).toBe(false)
      expect(isValidS3BucketName('bucket..with..dots')).toBe(false)
    })

    it('should return false for bucket names formatted as IP addresses', () => {
      expect(isValidS3BucketName('192.168.5.4')).toBe(false)
      expect(isValidS3BucketName('10.0.0.1')).toBe(false)
      expect(isValidS3BucketName('255.255.255.255')).toBe(false)
      expect(isValidS3BucketName('1.2.3.4')).toBe(false)
    })

    it('should return false for bucket names starting with forbidden prefixes', () => {
      expect(isValidS3BucketName('xn--bucket')).toBe(false)
      expect(isValidS3BucketName('sthree-bucket')).toBe(false)
      expect(isValidS3BucketName('amzn-s3-demo-bucket')).toBe(false)
    })

    it('should return false for bucket names ending with forbidden suffixes', () => {
      expect(isValidS3BucketName('bucket-s3alias')).toBe(false)
      expect(isValidS3BucketName('bucket--ol-s3')).toBe(false)
      expect(isValidS3BucketName('bucket.mrap')).toBe(false)
      expect(isValidS3BucketName('bucket--x-s3')).toBe(false)
      expect(isValidS3BucketName('bucket--table-s3')).toBe(false)
    })

    it('should return false for empty or invalid input', () => {
      expect(isValidS3BucketName('')).toBe(false)
    })
  })

  describe('isValidS3Path', () => {
    it('should return true for valid S3 paths', () => {
      expect(isValidS3Path('folder/file.txt')).toBe(true)
      expect(isValidS3Path('folder1/folder2/file.txt')).toBe(true)
    })

    it('should return false for paths with forbidden characters', () => {
      expect(isValidS3Path('folder[invalid]')).toBe(false)
    })
  })

  describe('normalizeS3Path', () => {
    it('should remove leading and trailing slashes', () => {
      expect(normalizeS3Path('/folder/path/')).toBe('folder/path')
      expect(normalizeS3Path('folder/path')).toBe('folder/path')
      expect(normalizeS3Path('/folder/path')).toBe('folder/path')
      expect(normalizeS3Path('folder/path/')).toBe('folder/path')
    })

    it('should return undefined for undefined input', () => {
      expect(normalizeS3Path(undefined)).toBeUndefined()
    })
  })
})
