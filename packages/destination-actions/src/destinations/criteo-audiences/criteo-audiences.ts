// eslint-disable-next-line no-restricted-syntax
import { createHash } from 'crypto'
import { IntegrationError, RetryableError } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'

const BASE_API_URL = 'https://api.criteo.com/2023-10'

export const hash = (value: string | undefined): string | undefined => {
  if (value === undefined) return

  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('hex')
}

class CriteoAPIError extends IntegrationError {
  readonly error?: Record<string, string>

  constructor(message: string, code: string, status: number, error?: Record<string, string>) {
    super(message, code, status)
    this.error = error
  }
}

export type Operation = {
  operation_type: string
  contactlist_id: string
  user_list: string[]
}

export type ClientCredentials = {
  client_id: string
  client_secret: string
  access_token?: string
}

const getRequestHeaders = async (
  request: RequestClient,
  credentials: ClientCredentials
): Promise<Record<string, string>> => {
  credentials = await criteoAuthenticate(request, credentials)

  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ` + credentials.access_token
  }
}

export const getAccessToken = async (request: RequestClient, credentials: ClientCredentials): Promise<string> => {
  const res = await request(`https://api.criteo.com/oauth2/token`, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      grant_type: 'client_credentials'
    }),
    headers: {
      Accept: 'text/plain',
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  const body = await res.json()

  if (res.status !== 200)
    // Centrifuge will automatically retry the batch if there's
    // an issue fetching an access token from Criteo.
    throw new RetryableError(`Error while getting an access token`)

  return body.access_token
}

export const criteoAuthenticate = async (
  request: RequestClient,
  credentials: ClientCredentials
): Promise<ClientCredentials> => {
  // If we don't have any auth token yet, we get one and add it to the credentials
  if (!credentials.access_token) credentials.access_token = await getAccessToken(request, credentials)
  return credentials
}

export const patchContactList = async (
  request: RequestClient,
  operation: Operation,
  credentials: ClientCredentials
): Promise<Response> => {
  if (isNaN(+operation.contactlist_id))
    throw new IntegrationError(
      `The Audience Segment ID should be a number (${operation.contactlist_id})`,
      'Invalid input',
      400
    )

  const endpoint = `${BASE_API_URL}/marketing-solutions/audience-segments/${operation.contactlist_id}/contact-list`
  const headers = await getRequestHeaders(request, credentials)
  const payload = {
    data: {
      type: 'ContactlistAmendment',
      attributes: {
        operation: operation.operation_type,
        identifierType: 'email',
        identifiers: operation.user_list
      }
    }
  }
  return request(endpoint, {
    method: 'PATCH',
    json: payload,
    headers: headers
  })
}

export const getContactListIdByName = async (
  request: RequestClient,
  advertiser_id: string,
  audience_segment_name: string,
  credentials: ClientCredentials
): Promise<string | undefined> => {
  if (isNaN(+advertiser_id)) throw new IntegrationError('The Advertiser ID should be a number', 'Invalid input', 400)

  const LIMIT = 100
  const headers = await getRequestHeaders(request, credentials)
  const payload = {
    data: {
      attributes: {
        audienceSegmentTypes: ['ContactList'],
        advertiserIds: [advertiser_id]
      }
    }
  }

  let continue_search = true
  let offset = 0
  interface AudienceSegment {
    attributes: {
      [key: string]: unknown
    }
    id: string
    type: string
  }

  interface ApiResponse {
    data: AudienceSegment[]
    meta: {
      totalItems: number
    }
  }

  let body: ApiResponse

  do {
    const endpoint = `${BASE_API_URL}/marketing-solutions/audience-segments/search?limit=${LIMIT}&offset=${offset}`

    const response = await request(endpoint, {
      method: 'POST',
      skipResponseCloning: true,
      headers: headers,
      json: payload
    })

    body = response.data as ApiResponse

    if (response.status !== 200)
      // Centrifuge will automatically retry the batch if there's
      // an issue fetching the Advertiser's audiences from Criteo.
      throw new RetryableError("Error while fetching the Advertiser's audiences")

    // If the contact list is found, return the corresponding ID
    for (const contactlist of body.data) {
      if (contactlist.attributes.name === audience_segment_name) return contactlist.id
    }

    // Else, continue searching
    offset += LIMIT
    continue_search = body.meta.totalItems > offset
  } while (continue_search)
}

export const getContactListId = async (
  request: RequestClient,
  advertiser_id: string,
  name: string,
  credentials: ClientCredentials
): Promise<string> => {
  let contactlist_id = undefined

  if (!name) throw new IntegrationError(`Invalid Audience Segment Name: ${name}`, 'Invalid input', 400)

  contactlist_id = await getContactListIdByName(request, advertiser_id, name, credentials)
  if (contactlist_id && !isNaN(+contactlist_id)) return contactlist_id

  // If the contact list is not found, create it
  try {
    return await createContactList(request, advertiser_id, name, credentials)
  } catch (e) {
    if (e instanceof CriteoAPIError) {
      // If the audience was created in the meantime
      if (e.error && e.error.code === 'name-must-be-unique') {
        // Loop through the advertiser's contact lists to find the contact list ID
        contactlist_id = await getContactListIdByName(request, advertiser_id, name, credentials)
        if (contactlist_id && !isNaN(+contactlist_id)) return contactlist_id
      }
    }
    // If no contact list ID was found, throw the error. Because the status code is 400,
    // Centrifuge will not automatically retry the batch, hence the batch has failed permanently.
    throw e
  }
}

export const createContactList = async (
  request: RequestClient,
  advertiser_id: string,
  name: string,
  credentials: ClientCredentials
): Promise<string> => {
  if (!name) throw new IntegrationError(`Invalid Contact List Name: ${name}`, 'Invalid audience', 400)
  if (isNaN(+advertiser_id)) throw new IntegrationError('The Advertiser ID should be a number', 'Invalid input', 400)

  const endpoint = `${BASE_API_URL}/marketing-solutions/audience-segments/create`
  const headers = await getRequestHeaders(request, credentials)
  const payload = {
    data: [
      {
        attributes: {
          advertiserId: advertiser_id,
          name: name,
          description: name,
          contactList: {}
        }
      }
    ]
  }

  const response = await request(endpoint, { method: 'POST', headers: headers, json: payload, throwHttpErrors: false })
  const body = await response.json()

  if (response.status !== 200) {
    const err = body.errors && body.errors[0] ? body.errors[0] : undefined
    throw new CriteoAPIError(`Error while creating the Contact List`, 'Criteo contact list creation error', 400, err)
  }

  if (!Array.isArray(body.data)) {
    throw new CriteoAPIError(
      `Error while creating the Contact List. data[] not returned`,
      'Criteo contact list creation error',
      403
    )
  }

  if (body.data.length === 0) {
    throw new CriteoAPIError(
      `Error while creating the Contact List. data[] is empty`,
      'Criteo contact list creation error',
      403
    )
  }

  if (body.data[0].id === undefined) {
    throw new CriteoAPIError(
      `Error while creating the Contact List. data[0].id is undefined`,
      'Criteo contact list creation error',
      403
    )
  }

  return body.data[0].id
}
