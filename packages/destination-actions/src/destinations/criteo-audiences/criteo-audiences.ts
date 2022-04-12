import { IntegrationError } from '@segment/actions-core'
import type { RequestClient } from '@segment/actions-core'

const BASE_API_URL = 'https://api.criteo.com/2022-01'

class CriteoAPIError extends Error {
    readonly error?: Record<string, string>

    constructor(message: string, error?: Record<string, string>) {
        super(message)
        this.error = error
    }
}

export type Operation = {
    operation_type: string,
    audience_id: string,
    user_list: string[]
}

export type ClientCredentials = {
    client_id: string,
    client_secret: string,
    access_token?: string
}

const getRequestHeaders = async (
    request: RequestClient,
    credentials: ClientCredentials
): Promise<Record<string, string>> => {
    credentials = await criteoAuthenticate(request, credentials)

    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ` + credentials.access_token
    }
}

export const getAccessToken = async (
    request: RequestClient,
    credentials: ClientCredentials
): Promise<string> => {
    const res = await request(`https://api.criteo.com/oauth2/token`, {
        method: 'POST',
        body: new URLSearchParams({
            client_id: credentials.client_id,
            client_secret: credentials.client_secret,
            grant_type: 'client_credentials'
        }),
        headers: {
            'Accept': 'text/plain',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
    })
    const body = await res.json()

    if (res.status !== 200)
        throw new Error(`Error while getting an access token: ${JSON.stringify(body)}`)

    return body.access_token
}

export const criteoAuthenticate = async (
    request: RequestClient,
    credentials: ClientCredentials
): Promise<ClientCredentials> => {
    // If we don't have any auth token yet, we get one and add it to the credentials
    if (!credentials.access_token)
        credentials.access_token = await getAccessToken(request, credentials)
    return credentials
}

export const patchAudience = async (
    request: RequestClient,
    operation: Operation,
    credentials: ClientCredentials
): Promise<Response> => {

    if (operation.operation_type !== "add" && operation.operation_type !== "remove")
        throw new Error(`Incorrect operation type: ${operation.operation_type}`)
    if (isNaN(+operation.audience_id))
        throw new Error(`The Audience ID should be a number (${operation.audience_id})`)

    const endpoint = `${BASE_API_URL}/audiences/${operation.audience_id}/contactlist`
    const headers = await getRequestHeaders(request, credentials)
    const payload = {
        "data": {
            "type": "ContactlistAmendment",
            "attributes": {
                "operation": operation.operation_type,
                "identifierType": "email",
                "identifiers": operation.user_list
            }
        }
    }
    return fetchRetry(request, endpoint, {
        method: 'PATCH',
        json: payload,
        headers: headers
    })
}

export const getAdvertiserAudiences = async (
    request: RequestClient,
    advertiser_id: string,
    credentials: ClientCredentials
): Promise<Array<Record<string, any>>> => {
    if (isNaN(+advertiser_id))
        throw new IntegrationError('The Advertiser ID should be a number', 'Invalid input', 400)

    const endpoint = `${BASE_API_URL}/audiences?advertiser-id=${advertiser_id}`
    const headers = await getRequestHeaders(request, credentials)
    const response = await request(
        endpoint, { method: 'GET', headers: headers }
    )

    const body = await response.json()

    if (response.status !== 200)
        throw new IntegrationError(`Error while fetching the Advertiser's audiences: ${JSON.stringify(body.errors)}`)

    return body.data
}

export const getAudienceIdByName = async (
    request: RequestClient,
    advertiser_id: string,
    audience_name: string,
    credentials: ClientCredentials
): Promise<string | undefined> => {
    const advertiser_audiences = await getAdvertiserAudiences(request, advertiser_id, credentials)
    for (const audience of advertiser_audiences) {
        if (audience.attributes.name === audience_name)
            return audience.id
    }
}

export const getAudienceId = async (
    request: RequestClient,
    advertiser_id: string,
    audience_name: string,
    credentials: ClientCredentials
): Promise<string> => {
    let audience_id = undefined

    if (!audience_name)
        throw new Error(`Invalid Audience Name: ${audience_name}`)

    // Loop through the advertiser's audiences. If the audience name is found, return the corresponding ID.
    audience_id = await getAudienceIdByName(request, advertiser_id, audience_name, credentials)
    if (audience_id) return audience_id

    // If the audience is not found, create it
    try {
        return await createAudience(request, advertiser_id, audience_name, credentials)
    }
    catch (e) {
        if (e instanceof CriteoAPIError) {
            // If the audience was created in the meantime
            if (e.error && e.error.code === "invalid-audience-name-duplicated") {
                // Return the audience ID from the error message
                audience_id = e.error.detail.split(" ").pop()
                if (audience_id && !isNaN(+audience_id)) return audience_id

                // If no audience ID found in the error message, loop through the advertiser's audiences
                audience_id = await getAudienceIdByName(request, advertiser_id, audience_name, credentials)
                if (audience_id && !isNaN(+audience_id)) return audience_id

            }
        }

        // If no audience ID was found
        throw e
    }

}

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms))

//function for fetch Retries with exponential backoff
const fetchRetry = async (
    request: RequestClient,
    endpoint: string,
    options: {},
    retries = 3,
    backoff = 300
): Promise<Response> => {

    try {
        return await request(endpoint, options);
    } catch (err) {
        if (retries === 1) {
            throw new Error('All retries failed!')
        }
        await delay(backoff)
        return await fetchRetry(request, endpoint, options, retries - 1, backoff * 2)
    }
}

export const createAudience = async (
    request: RequestClient,
    advertiser_id: string,
    audience_name: string,
    credentials: ClientCredentials
): Promise<string> => {
    if (!audience_name)
        throw new Error(`Invalid Audience Name: ${audience_name}`)
    if (isNaN(+advertiser_id))
        throw new IntegrationError('The Advertiser ID should be a number', 'Invalid input', 400)

    const endpoint = `${BASE_API_URL}/audiences`
    const headers = await getRequestHeaders(request, credentials)
    const payload = {
        "data": {
            "attributes": {
                "advertiserId": advertiser_id,
                "name": audience_name,
                "description": audience_name
            },
            "type": "Audience"
        }
    }

    const response = await request(
        endpoint, { method: 'POST', headers: headers, json: payload, throwHttpErrors: false }
    )
    const body = await response.json()

    if (response.status !== 200) {
        const err = body.errors && body.errors[0] ? body.errors[0] : undefined
        throw new CriteoAPIError(`Error while creating the audience: ${JSON.stringify(body.errors)}`, err)
    }

    return body.data.id
}