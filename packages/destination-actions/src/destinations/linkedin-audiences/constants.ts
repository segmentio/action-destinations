import { LINKEDIN_AUDIENCES_API_VERSION } from './versioning-info'

export const LINKEDIN_API_VERSION = LINKEDIN_AUDIENCES_API_VERSION
export const BASE_URL = 'https://api.linkedin.com/rest'
export const LINKEDIN_SOURCE_PLATFORM = 'SEGMENT'

// LinkedIn service error codes that indicate token propagation delays (eventual consistency).
// These 401s are not true revocations — the token is valid but not yet propagated.
export const LINKEDIN_TOKEN_PROPAGATION_ERROR_CODES = [65601, 65602]
