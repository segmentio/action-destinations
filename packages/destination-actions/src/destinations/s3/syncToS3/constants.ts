import { HashAlgorithm, Normalization } from './types'

export const SUPPORTED_HASH_ALGORITHMS: HashAlgorithm[] = ['sha256']

export const SUPPORTED_NORMALIZATIONS: Normalization[] = ['none', 'lowercase', 'trim', 'lowercase_trim']

// Refresh STS credentials this long before their reported expiration so we never hand out
// credentials that would expire mid-upload.
export const CREDENTIALS_EXPIRY_BUFFER_MS = 5 * 60 * 1000

// Bound how long a single AssumeRole call can hang. Without this, a stalled STS call would block
// every concurrent upload de-duped onto it (see inFlightAssumeRole in client.ts) indefinitely.
export const STS_REQUEST_TIMEOUT_MS = 10 * 1000
