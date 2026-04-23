export const DEFAULT_VOICEOPS_BASE_URL = 'https://projectfrontline.net'

export function normalizeVoiceopsBaseUrl(baseUrl?: string): string {
  return (baseUrl ?? DEFAULT_VOICEOPS_BASE_URL).trim().replace(/\/+$/, '')
}

export function getVoiceopsAuthenticationEndpoint(baseUrl?: string): string {
  return `${normalizeVoiceopsBaseUrl(baseUrl)}/frontline-api/integrations/v1/segment/authentication`
}

export function getVoiceopsCallsEndpoint(baseUrl?: string): string {
  return `${normalizeVoiceopsBaseUrl(baseUrl)}/frontline-api/integrations/v1/segment/calls`
}

export const SEGMENT_USER_AGENT = 'Segment'
