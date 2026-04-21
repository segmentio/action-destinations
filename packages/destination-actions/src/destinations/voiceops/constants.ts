export const VOICEOPS_BASE_URL = process?.env?.ACTIONS_VOICEOPS_BASE_URL_SECRET ?? 'https://projectfrontline.net'

export const VOICEOPS_AUTHENTICATION_ENDPOINT = `${VOICEOPS_BASE_URL}/frontline-api/integrations/v1/segment/authentication`
export const VOICEOPS_CALLS_ENDPOINT = `${VOICEOPS_BASE_URL}/frontline-api/integrations/v1/segment/calls`
export const SEGMENT_USER_AGENT = 'Segment'
