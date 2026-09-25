export const S3_HASHING_FEATURE_FLAG = 'actions-s3-hashing'

// Fixes filename extension corruption (STRATCONN-6988) by inserting the timestamp suffix by
// length rather than via a naive string .replace(). Off by default for a gradual, safe rollout
// after STRATCONN-6986 / INC 20659.
export const S3_FILENAME_FIX_FLAG = 'actions-s3-filename-fix'

export const S3_STS_CREDENTIAL_CACHE_FLAG = 'actions-s3-sts-credential-cache'
