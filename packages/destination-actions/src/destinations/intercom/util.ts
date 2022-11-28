import { ModifiedResponse, RequestClient } from '@segment/actions-core'
import dayjs from '../../lib/dayjs'

interface IntercomContact {
  id: string
}
interface IntercomSearchData {
  total_count: number
  data: Array<IntercomContact>
}
interface SearchPayload {
  external_id?: string
  email?: string
}

/**
 * Search intercom for a unique contact. Prioritizes using external_id if passed. If not, then uses email.
 * If no contact is found, returned undefined.
 * If multiple contacts are found with the email, also return undefined.
 *
 * Intercom's API Docs - https://developers.intercom.com/intercom-api-reference/reference/search-for-contacts
 */
export async function getUniqueIntercomContact(request: RequestClient, payload: SearchPayload) {
  const { external_id, email } = payload
  let query
  if (external_id) {
    query = {
      field: 'external_id',
      operator: '=',
      value: external_id
    }
  } else if (email) {
    query = {
      field: 'email',
      operator: '=',
      value: email
    }
  } else {
    return
  }

  const response: ModifiedResponse<IntercomSearchData> = await request('https://api.intercom.io/contacts/search', {
    method: 'POST',
    json: { query }
  })

  if (response?.data?.total_count === 1) {
    return response.data.data[0]
  }
}

export const convertValidTimestamp = <Value = unknown>(value: Value): Value | number => {
  // Timestamps may be on a `string` field, so check if the string is only
  // numbers. If it is, ignore it since it's probably already a unix timestamp.
  // DayJS doesn't parse unix timestamps correctly outside of the `.unix()`
  // initializer.
  if (typeof value !== 'string' || /^\d+$/.test(value)) {
    return value
  }

  const maybeDate = dayjs.utc(value)

  if (maybeDate.isValid()) {
    return maybeDate.unix()
  }

  return value
}
