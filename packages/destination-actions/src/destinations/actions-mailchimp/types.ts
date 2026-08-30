import type { SubscriptionStatus, TagStatus } from './constants'

// ---- Add or Update Audience Member ----

// Request body for PUT /lists/{list_id}/members/{subscriber_hash}
export interface UpsertMemberRequest {
  email_address: string
  status_if_new: SubscriptionStatus
  status?: SubscriptionStatus
  merge_fields?: Record<string, unknown>
  language?: string
  vip?: boolean
  tags?: string[]
}

// A single member entry in the batch upsert body.
export interface BatchMemberOperation extends UpsertMemberRequest {}

// Request body for POST /lists/{list_id} (batch subscribe/unsubscribe).
export interface BatchMembersRequest {
  members: BatchMemberOperation[]
  update_existing: boolean
}

// ---- Add or Remove Member Tags ----

export interface MemberTag {
  name: string
  status: TagStatus
}

// Request body for POST /lists/{list_id}/members/{subscriber_hash}/tags
export interface MemberTagsRequest {
  tags: MemberTag[]
}

// ---- Responses ----

export interface MemberResponse {
  id?: string
  email_address?: string
  status?: string
}

// A single error entry returned in the batch member upsert response.
export interface BatchMemberError {
  email_address?: string
  error?: string
  error_code?: string
}

export interface BatchMembersResponse {
  total_created?: number
  total_updated?: number
  error_count?: number
  errors?: BatchMemberError[]
}
