interface BaseAppcuesRequest {
  userId?: string
  anonymousId?: string
  context?: Record<string, unknown>
  integrations?: Record<string, unknown>
  timestamp?: string
  messageId?: string
}

export interface AppcuesTrackRequest extends BaseAppcuesRequest {
  type: 'track'
  event: string
  properties?: Record<string, unknown>
}

export interface AppcuesIdentifyRequest extends BaseAppcuesRequest {
  type: 'identify'
  traits: Record<string, unknown>
}

export interface AppcuesGroupRequest extends BaseAppcuesRequest {
  type: 'group'
  groupId: string
  traits?: Record<string, unknown>
}

export type AppcuesRequest = AppcuesTrackRequest | AppcuesIdentifyRequest | AppcuesGroupRequest
