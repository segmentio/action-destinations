import { InvalidAuthenticationError } from '@segment/actions-core'

export const DEFAULT_VOICEOPS_BASE_URL = 'https://projectfrontline.net'

export function normalizeVoiceopsBaseUrl(baseUrl?: string): string {
  const normalized = (baseUrl?.trim() || DEFAULT_VOICEOPS_BASE_URL).replace(/\/+$/, '')
  try {
    const url = new URL(normalized)
    if (url.protocol === 'http:' || url.protocol === 'https:') {
      return normalized
    }
  } catch {
    // Report invalid settings consistently before sending any request.
  }
  throw new InvalidAuthenticationError('Base URL must be a valid HTTP or HTTPS URL.')
}

export function getVoiceopsAuthenticationEndpoint(baseUrl?: string): string {
  return `${normalizeVoiceopsBaseUrl(baseUrl)}/frontline-api/integrations/v1/segment/authentication`
}

export function getVoiceopsCallsEndpoint(baseUrl?: string): string {
  return `${normalizeVoiceopsBaseUrl(baseUrl)}/frontline-api/integrations/v1/segment/calls`
}

export function getVoiceopsMetadataEndpoint(baseUrl?: string): string {
  return `${normalizeVoiceopsBaseUrl(baseUrl)}/frontline-api/integrations/v1/segment/metadata`
}

export const SEGMENT_USER_AGENT = 'Segment'
