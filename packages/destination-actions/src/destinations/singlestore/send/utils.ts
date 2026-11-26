import { RequestClient, IntegrationError, Features } from '@segment/actions-core'
import { Payload } from './generated-types'
import { Settings } from '../generated-types'
import { ExecJSONRequest, ExecJSONResponse, FlatArgsTuple, FlattenedArgs } from '../types'
import { getErrorMessage, getExecUrl, SSRF_HARDENING_FLAGON } from '../utils'
import btoa from 'btoa-lite'

export async function send(
  request: RequestClient,
  payloads: Payload[],
  settings: Settings,
  features?: Features
): Promise<ExecJSONResponse> {
  const { username, password, dbName, tableName } = settings
  const hardened = Boolean(features && features[SSRF_HARDENING_FLAGON])
  const url = getExecUrl(settings, hardened)
  const encodedCredentials = btoa(`${username}:${password}`)

  const columns = [
    'messageId',
    'timestamp',
    'type',
    'event',
    'name',
    'properties',
    'userId',
    'anonymousId',
    'groupId',
    'traits',
    'context'
  ]

  const sqlValuesClause = payloads.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ')

  const sql = `INSERT INTO \`${tableName.replace(/`/g, '``')}\` (${columns.join(', ')}) VALUES ${sqlValuesClause}`

  function toUTCDateTime(timestamp: string): string {
    return timestamp.replace('T', ' ').replace('Z', '') // 'YYYY-MM-DD HH:MM:SS.SSS'
  }

  const argsTuples: FlatArgsTuple[] = payloads.map(
    (item): FlatArgsTuple => [
      item.messageid,
      toUTCDateTime(item.timestamp),
      item.type,
      item.event ?? null,
      item.name ?? null,
      item.properties ?? null,
      item.userId ?? null,
      item.anonymousId ?? null,
      item.groupId ?? null,
      item.traits ?? null,
      item.context ?? null
    ]
  )

  const args: FlattenedArgs = argsTuples.flat()

  const requestData: ExecJSONRequest = {
    sql,
    database: dbName,
    args
  }

  const response = await request<ExecJSONResponse>(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${encodedCredentials}`
    },
    json: requestData,
    throwHttpErrors: false
  })

  if (response.status !== 200 || response.ok === false) {
    throw new IntegrationError(
      `Failed to insert data: ${
        hardened ? await getErrorMessage(response) : (await response.text()) || 'Unknown error'
      }`,
      response.statusText,
      response.status
    )
  }
  return response
}
