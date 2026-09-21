export const S3_HASHING_FEATURE_FLAG = 'actions-s3-hashing'

// Rejects S3 object keys over the AWS 1024-byte limit up front, instead of letting the PUT fail
// late and opaquely. Off by default for a gradual, safe rollout after STRATCONN-6986/INC 20659.
export const S3_KEY_LENGTH_GUARD_FLAG = 'actions-s3-key-length-guard'
