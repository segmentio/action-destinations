import { FACEBOOK_CUSTOM_AUDIENCES_API_VERSION, FACEBOOK_CUSTOM_AUDIENCES_CANARY_API_VERSION } from './versioning-info'

export const API_VERSION = FACEBOOK_CUSTOM_AUDIENCES_API_VERSION

export const CANARY_API_VERSION = FACEBOOK_CUSTOM_AUDIENCES_CANARY_API_VERSION

export const FACEBOOK_CUSTOM_AUDIENCE_FLAGON = 'facebook-custom-audience-actions-canary-version'

export const FACEBOOK_CUSTOM_AUDIENCE_JOURNEYS_FLAGON = 'facebook-custom-audience-actions-journeys-support'

// When enabled, a phone that normalizes to an empty string (e.g. '+0000000000') is
// discarded to '' instead of throwing 'Cannot hash an empty string' and failing the whole batch.
export const FLAGON_NAME_BATCH_DISCARD_FIX = 'fb-custom-audience-batch-discard-fix'

export const BASE_URL = 'https://graph.facebook.com'
