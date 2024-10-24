import { RequestClient, PayloadValidationError } from '@segment/actions-core'
import type { Payload } from './generated-types'
import { SendEmailReq } from './types'
import {
  RESERVED_HEADERS,
  MAX_CATEGORY_LENGTH,
  MIN_IP_POOL_NAME_LENGTH,
  MAX_IP_POOL_NAME_LENGTH,
  SEND_EMAIL_URL
} from './constants'

export async function send(request: RequestClient, payload: Payload) {
  validate(payload)

  const groupId = getIntFromString(payload.group_id)

  const json: SendEmailReq = {
    personalizations: [
      {
        to: payload.to.map((to) => ({ email: to.email, name: to?.name ?? undefined })),
        cc: payload.cc?.map((cc) => ({ email: cc.email, name: cc?.name ?? undefined })) ?? undefined,
        bcc: payload.bcc?.map((bcc) => ({ email: bcc.email, name: bcc?.name ?? undefined })) ?? undefined,
        headers:
          Object.entries(payload?.headers ?? {}).reduce((acc, [key, value]) => {
            acc[key] = String(value)
            return acc
          }, {} as Record<string, string>) || undefined,
        dynamic_template_data: payload.dynamic_template_data,
        custom_args:
          payload?.custom_args && Object.keys(payload.custom_args).length > 0
            ? Object.fromEntries(Object.entries(payload.custom_args).map(([key, value]) => [key, String(value)]))
            : undefined,
        send_at: toUnixTS(payload.send_at) ?? undefined
      }
    ],
    from: { email: payload.from.email, name: payload.from?.name ?? undefined },
    reply_to: {
      email: (payload.reply_to.reply_to_equals_from ? payload.from.email : payload.reply_to.email) as string,
      name: payload.reply_to.reply_to_equals_from ? payload.from.name : payload.reply_to.name
    },
    template_id: payload.template_id,
    categories: payload.categories,
    asm: typeof groupId === 'number' ? { group_id: groupId } : undefined,
    ip_pool_name: payload.ip_pool_name,
    tracking_settings: {
      subscription_tracking: payload.subscription_tracking ?? undefined,
      ganalytics: payload.google_analytics ?? undefined
    },
    mail_settings: typeof payload.sandbox_mode === 'boolean' ? { sandbox_mode: payload.sandbox_mode } : undefined
  }

  return await request(SEND_EMAIL_URL, {
    method: 'post',
    json
  })
}

function toUnixTS(date: string | undefined): number | undefined {
  if (typeof date === 'undefined' || date === null || date === '') {
    return undefined
  }

  return new Date(date).getTime()
}

function getIntFromString(value: string | undefined): number | undefined {
  const regex = /^\d+/
  const match = regex.exec(value ?? '')
  if (match) {
    const maybeInt = parseInt(match[0], 10)
    if (!isNaN(maybeInt)) {
      return maybeInt
    }
  }
  return undefined
}

function validate(payload: Payload) {
  if (payload.group_id && typeof getIntFromString(payload.group_id) !== 'number') {
    throw new PayloadValidationError('Group ID value must be a numberic (integer) string')
  }

  if (payload.domain && !payload.from.email.endsWith(payload.domain)) {
    throw new PayloadValidationError('From email must be from the selected domain')
  }

  if (!payload.template_id.startsWith('d-')) {
    throw new PayloadValidationError(
      'Template ID must refer to a Dynamic Template. Dynamic Template IDs start with "d-"'
    )
  }

  if (!payload.reply_to.reply_to_equals_from && !payload.reply_to.email) {
    throw new PayloadValidationError("'Reply To >> Email' must be provided if 'Reply To Equals From' is set to true")
  }

  if (Object.keys(payload?.headers ?? {}).some((key) => RESERVED_HEADERS.includes(key))) {
    throw new PayloadValidationError(
      `Headers cannot contain any of the following reserved headers: ${RESERVED_HEADERS.join(', ')}`
    )
  }

  payload?.categories?.forEach((category) => {
    if (category.length > MAX_CATEGORY_LENGTH) {
      throw new PayloadValidationError(
        `Category with name ${category} exceeds the max length of ${MAX_CATEGORY_LENGTH} characters`
      )
    }
  })

  if (payload.send_at) {
    const sendAt = new Date(payload.send_at)
    const now = new Date()
    if (sendAt.getTime() < now.getTime() || sendAt.getTime() > now.getTime() + 72 * 60 * 60 * 1000) {
      throw new PayloadValidationError('send_at should be less than 72 hours from now')
    }
  }

  if (
    payload.ip_pool_name &&
    (payload.ip_pool_name.length >= MAX_IP_POOL_NAME_LENGTH || payload.ip_pool_name.length <= MIN_IP_POOL_NAME_LENGTH)
  ) {
    throw new PayloadValidationError(
      `IP Pool Name should at least ${MIN_IP_POOL_NAME_LENGTH} characters and at most ${MAX_IP_POOL_NAME_LENGTH} characters in length`
    )
  }

  return
}
