import { PayloadValidationError, RequestClient } from '@segment/actions-core'
import { Payload } from '../syncAudience/generated-types'
import { UpdateAudienceReq, Columns } from '../types'
import { EMAIL_SCHEMA_NAME, MAID_SCHEMA_NAME } from '../const'
// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'

export async function send(request: RequestClient, payloads: Payload[]) {
  const audienceId = payloads[0].external_audience_id
  if (!audienceId) {
    throw new PayloadValidationError('External Audience ID is required.')
  }
  const validPayloads = cleanPayloads(payloads)
  const addPayloads = validPayloads.filter((p) => p.traits_or_props[p.computation_key] === true)
  const removePayloads = validPayloads.filter((p) => p.traits_or_props[p.computation_key] === false)
  const addColumns = getColumns(addPayloads)
  const removeColumns = getColumns(removePayloads)

  const addJSON: UpdateAudienceReq = {
    data: {
      column_order: addColumns,
      user_data: addPayloads.map((p) => {
        const data: string[] = []
        if (addColumns.includes(EMAIL_SCHEMA_NAME) && p.email) {
          data.push(p.email ?? '')
        }
        if (addColumns.includes(MAID_SCHEMA_NAME)) {
          data.push(p.androidIDFA ?? p.iosIDFA ?? '')
        }
        return data
      }),
      action_type: 'ADD'
    }
  }

  if (addJSON.data.user_data.length > 0) {
    await updateAudience(request, addJSON, audienceId)
  }

  const removeJSON: UpdateAudienceReq = {
    data: {
      column_order: removeColumns,
      user_data: removePayloads.map((p) => {
        const data: string[] = []
        if (removeColumns.includes(EMAIL_SCHEMA_NAME) && p.email) {
          data.push(p.email)
        }
        if (removeColumns.includes(MAID_SCHEMA_NAME)) {
          data.push(p.androidIDFA ?? p.iosIDFA ?? '')
        }
        return data
      }),
      action_type: 'REMOVE'
    }
  }

  if (removeJSON.data.user_data.length > 0) {
    await updateAudience(request, removeJSON, audienceId)
  }
}

function cleanPayloads(payloads: Payload[]): Payload[] {
  const p = payloads
    .filter((payload) => payload.email || payload.iosIDFA || payload.androidIDFA)
    .map((payload) => {
      const copy = { ...payload }
      if (copy.email && !ensureHashed(copy.email)) {
        copy.email = hashEmail(copy.email)
      }
      if (copy.iosIDFA && !ensureHashed(copy.iosIDFA)) {
        const hash = createHash('sha256')
        hash.update(copy.iosIDFA)
        copy.iosIDFA = hash.digest('hex')
      }
      if (copy.androidIDFA && !ensureHashed(copy.androidIDFA)) {
        const hash = createHash('sha256')
        hash.update(copy.androidIDFA)
        copy.androidIDFA = hash.digest('hex')
      }
      return copy
    })
  return p
}

function getColumns(payloads: Payload[]): Columns {
  const hasEmail = payloads.some((payload) => !!payload.email)
  const hasMAID = payloads.some((payload) => payload.androidIDFA || payload.iosIDFA)
  return [...(hasEmail ? [EMAIL_SCHEMA_NAME] : []), ...(hasMAID ? [MAID_SCHEMA_NAME] : [])] as Columns
}

async function updateAudience(request: RequestClient, json: UpdateAudienceReq, audienceid: string) {
  return await request<UpdateAudienceReq>(`https://ads-api.reddit.com/api/v3/custom_audiences/${audienceid}/users`, {
    method: 'PATCH',
    json
  })
}

function ensureHashed(value: string): boolean {
  const sha256HashedRegex = /^[a-f0-9]{64}$/i
  return sha256HashedRegex.test(value)
}

function hashEmail(value: string): string {
  const email = canonicalizeEmail(value)
  const hash = createHash('sha256')
  hash.update(email)
  return hash.digest('hex')
}

// canonicalize the email to follow Reddit email formats before hashing
function canonicalizeEmail(value: string): string {
  const localPartAndDomain = value.split('@')
  const localPart = localPartAndDomain[0].replace(/\./g, '').split('+')[0]
  return `${localPart.toLowerCase()}@${localPartAndDomain[1].toLowerCase()}`
}
