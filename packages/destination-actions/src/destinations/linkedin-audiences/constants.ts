import type { Features } from '@segment/actions-core'
import { LINKEDIN_AUDIENCES_API_VERSION, LINKEDIN_AUDIENCES_CANARY_API_VERSION } from './versioning-info'

export const LINKEDIN_API_VERSION = LINKEDIN_AUDIENCES_API_VERSION
export const LINKEDIN_CANARY_API_VERSION = LINKEDIN_AUDIENCES_CANARY_API_VERSION
export const BASE_URL = 'https://api.linkedin.com/rest'
export const LINKEDIN_SOURCE_PLATFORM = 'SEGMENT'

export const FLAGON_NAME = 'linkedin-audiences-canary-version'

export function getApiVersion(features?: Features): string {
  return features && features[FLAGON_NAME] ? LINKEDIN_CANARY_API_VERSION : LINKEDIN_API_VERSION
}
