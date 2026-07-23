import { RequestClient, PayloadValidationError, APIError, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from './generated-types'
import type { Payload as MemberPayload } from './addOrUpdateMember/generated-types'
import type { Payload as TagsPayload } from './addOrRemoveTags/generated-types'
import { processHashing } from '../../lib/hashing-utils'
import {
  getBaseUrl,
  resolveDataCenter,
  memberPath,
  batchMembersPath,
  memberTagsPath,
  DEFAULT_BATCH_SIZE
} from './constants'
import type {
  UpsertMemberRequest,
  BatchMembersRequest,
  BatchMemberOperation,
  MemberTagsRequest,
  MemberTag,
  MemberResponse,
  BatchMembersResponse
} from './types'

// Mailchimp uses the MD5 hash of the lowercased email as the subscriber hash in URLs.
export const getSubscriberHash = (email: string): string =>
  processHashing(email, 'md5', 'hex', (value) => value.trim().toLowerCase())

const baseUrlFor = (settings: Settings): string => getBaseUrl(resolveDataCenter(settings.apiKey, settings.dataCenter))

const resolveEmail = (email?: string): string => {
  if (!email || email.trim() === '') {
    throw new PayloadValidationError('An email address is required to identify the audience member.')
  }
  return email
}

const resolveListId = (settings: Settings, payloadListId?: string): string => {
  const listId = payloadListId && payloadListId.trim() !== '' ? payloadListId : settings.audienceId
  if (!listId || listId.trim() === '') {
    throw new PayloadValidationError('A Mailchimp Audience (List) ID is required.')
  }
  return listId
}

// ---- Add or Update Audience Member ----

const buildMemberBody = (payload: MemberPayload): UpsertMemberRequest => {
  const body: UpsertMemberRequest = {
    email_address: payload.email_address,
    status_if_new: payload.status_if_new
  }
  if (payload.status) body.status = payload.status
  if (payload.merge_fields && Object.keys(payload.merge_fields).length > 0) body.merge_fields = payload.merge_fields
  if (payload.language) body.language = payload.language
  if (typeof payload.vip === 'boolean') body.vip = payload.vip
  if (payload.tags && payload.tags.length > 0) body.tags = payload.tags
  return body
}

export const upsertMember = async (
  request: RequestClient,
  settings: Settings,
  payload: MemberPayload
): Promise<ModifiedResponse<MemberResponse>> => {
  const email = resolveEmail(payload.email_address)
  const listId = resolveListId(settings, payload.list_id)
  const subscriberHash = getSubscriberHash(email)
  const url = `${baseUrlFor(settings)}${memberPath(listId, subscriberHash)}`

  return request<MemberResponse>(url, {
    method: 'PUT',
    json: buildMemberBody(payload)
  })
}

export const upsertMemberBatch = async (
  request: RequestClient,
  settings: Settings,
  payloads: MemberPayload[]
): Promise<ModifiedResponse<BatchMembersResponse> | void> => {
  // All events in a batch share the same list (grouped via batch_keys on list_id).
  const valid = payloads.filter((p) => p.email_address && p.email_address.trim() !== '')
  if (valid.length === 0) {
    throw new PayloadValidationError('No audience members with a valid email address in the batch.')
  }

  const listId = resolveListId(settings, valid[0].list_id)
  const members: BatchMemberOperation[] = valid.map((p) => buildMemberBody(p))
  const body: BatchMembersRequest = {
    members: members.slice(0, DEFAULT_BATCH_SIZE),
    update_existing: true
  }
  const url = `${baseUrlFor(settings)}${batchMembersPath(listId)}`

  return request<BatchMembersResponse>(url, {
    method: 'POST',
    json: body
  })
}

// ---- Add or Remove Member Tags ----

const buildTagsBody = (payload: TagsPayload): MemberTagsRequest => {
  const tags: MemberTag[] = []

  if (payload.tags && payload.tags.length > 0) {
    for (const tag of payload.tags) {
      if (tag && tag.name && tag.name.trim() !== '') {
        tags.push({ name: tag.name, status: tag.status })
      }
    }
  }
  if (payload.tags_to_add) {
    for (const name of payload.tags_to_add) {
      if (name && name.trim() !== '') tags.push({ name, status: 'active' })
    }
  }
  if (payload.tags_to_remove) {
    for (const name of payload.tags_to_remove) {
      if (name && name.trim() !== '') tags.push({ name, status: 'inactive' })
    }
  }

  if (tags.length === 0) {
    throw new PayloadValidationError('At least one tag to add or remove is required.')
  }
  return { tags }
}

export const updateMemberTags = async (
  request: RequestClient,
  settings: Settings,
  payload: TagsPayload
): Promise<ModifiedResponse<unknown>> => {
  const email = resolveEmail(payload.email)
  const listId = resolveListId(settings, payload.list_id)
  const subscriberHash = getSubscriberHash(email)
  const body = buildTagsBody(payload)
  const url = `${baseUrlFor(settings)}${memberTagsPath(listId, subscriberHash)}`

  try {
    return await request<unknown>(url, {
      method: 'POST',
      json: body
    })
  } catch (error) {
    const status = (error as { response?: { status?: number }; status?: number })?.response?.status
    if (status === 404) {
      throw new APIError(
        'Audience member not found. Run the "Add or Update Audience Member" action to create the member before applying tags.',
        404
      )
    }
    throw error
  }
}
