import { validateIamRoleArnFormat } from '../utils'

describe('validateIamRoleArnFormat', () => {
  it('should return true for a valid IAM Role ARN', () => {
    const validArns = [
      'arn:aws:iam::123456789012:role/MyRole',
      'arn:aws:iam::000000000000:role/service-role/My-Service_Role',
      'arn:aws:iam::987654321098:role/path/to/MyRole',
      'arn:aws:iam::111122223333:role/MyRole-With.Special@Chars_+=,.'
    ]

    for (const arn of validArns) {
      expect(validateIamRoleArnFormat(arn)).toBe(true)
    }
  })

  it('should return false for an ARN with invalid prefix', () => {
    const invalidArn = 'arn:aws:s3::123456789012:role/MyRole'
    expect(validateIamRoleArnFormat(invalidArn)).toBe(false)
  })

  it('should return false if missing account ID', () => {
    const invalidArn = 'arn:aws:iam:::role/MyRole'
    expect(validateIamRoleArnFormat(invalidArn)).toBe(false)
  })

  it('should return false if account ID is not 12 digits', () => {
    const invalidArns = ['arn:aws:iam::12345:role/MyRole', 'arn:aws:iam::1234567890123:role/MyRole']
    for (const arn of invalidArns) {
      expect(validateIamRoleArnFormat(arn)).toBe(false)
    }
  })

  it('should return false if missing "role/" segment', () => {
    const invalidArn = 'arn:aws:iam::123456789012:MyRole'
    expect(validateIamRoleArnFormat(invalidArn)).toBe(false)
  })

  it('should return false if role name contains invalid characters', () => {
    const invalidArns = [
      'arn:aws:iam::123456789012:role/My Role', // space
      'arn:aws:iam::123456789012:role/MyRole#InvalidChar'
    ]
    for (const arn of invalidArns) {
      expect(validateIamRoleArnFormat(arn)).toBe(false)
    }
  })

  it('should return false for empty or null values', () => {
    expect(validateIamRoleArnFormat('')).toBe(false)
    // @ts-expect-error testing invalid input type
    expect(validateIamRoleArnFormat(null)).toBe(false)
    // @ts-expect-error testing invalid input type
    expect(validateIamRoleArnFormat(undefined)).toBe(false)
  })
})
