import { API_VERSION } from './versioning-info'

// Verified stable receiver. Access remains restricted server-side to the
// approved test workspace; this does not enable a customer beta.
export const API_BASE_URL = `https://eventguard.io/${API_VERSION}/segment`

export const MAX_EVENT_BYTES = 64 * 1024
