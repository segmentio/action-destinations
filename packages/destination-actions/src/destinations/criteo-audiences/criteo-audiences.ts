import { RequestOptions, IntegrationError } from '@segment/actions-core'

const BASE_API_URL = 'https://api.criteo.com/2022-01'

export type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

export type Operation = {
    operation_type: string,
    audience_id: string,
    user_list: string[]
}

export type ClientCredentials = {
    client_id: string,
    client_secret: string
}

const getRequestHeaders = async (
    request: RequestFn,
    credentials: ClientCredentials
): Promise<Record<string, string>> => {
    const access_token: string = await getAccessToken(request, credentials);

    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ` + access_token
    }
}

const getAccessToken = async (
    request: RequestFn,
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

    return body.access_token
}

export const patchAudience = async (
    request: RequestFn,
    operation: Operation,
    credentials: ClientCredentials
): Promise<Response> => {

    if (operation.operation_type !== "add" && operation.operation_type !== "remove")
        throw new Error(`Incorrect operation type: ${operation.operation_type}`)
    if (isNaN(+operation.audience_id))
        throw new IntegrationError('The Audience ID should be a number', 'Invalid input', 400)

    const endpoint = `${BASE_API_URL}/audiences/${operation.audience_id}/contactlist`
    const headers = getRequestHeaders(request, credentials);
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
    const options = {
        method: 'PATCH',
        json: payload,
        headers: headers
    }
    return await fetchRetry(
        request,
        endpoint,
        options
    );
}

export const getAdvertiserAudiences = async (
    request: RequestFn,
    advertiser_id: string,
    credentials: ClientCredentials
): Promise<Array<Record<string, any>>> => {
    if (isNaN(+advertiser_id))
        throw new IntegrationError('The Advertiser ID should be a number', 'Invalid input', 400)

    const endpoint = `${BASE_API_URL}/audiences?advertiser-id=${advertiser_id}`
    const headers = await getRequestHeaders(request, credentials);
    const response = await request(
        endpoint, { method: 'GET', headers: headers }
    )

    const body = await response.json()

    if (response.status !== 200)
        throw new IntegrationError(
            "Error while fetching the Advertiser's audiences", body.errors[0].title, response.status
        )

    return body.data
}

export const getAudienceId = async (
    request: RequestFn,
    advertiser_id: string,
    audience_name: string,
    credentials: ClientCredentials
): Promise<string> => {
    if (!audience_name)
        throw new IntegrationError('Invalid Audience Key', 'Invalid input', 400)

    const advertiser_audiences = await getAdvertiserAudiences(request, advertiser_id, credentials)

    advertiser_audiences.forEach(audience => {
        if (audience.attributes.name === audience_name)
            return audience.id
    });

    return await createAudience(request, advertiser_id, audience_name, credentials)
}

/*function for fetch Retries
const fetchRetry = async (
    request: RequestFn,
    endpoint: string,
    options: {},
    retries = 3,
    backoff = 300
): Promise<Response> => {

    // run the fetch like normal
    return await request(endpoint, options)
        .then(
            res => {
                if (res.ok) return res.json();
                if (retries > 0) {
                    setTimeout(() => {
                        return await fetchRetry(request, endpoint, options, retries - 1, backoff * 2);
                    }, backoff);
                }
                else {
                    throw new Error('Exhausted all retries.')

                }
            }
        ).catch(console.error); //catches failures with fetch itself and not Criteo API
}*/



export const createAudience = async (
    request: RequestFn,
    advertiser_id: string,
    audience_name: string,
    credentials: ClientCredentials
): Promise<string> => {
    const endpoint = `${BASE_API_URL}/audiences`
    const headers = await getRequestHeaders(request, credentials);
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
        endpoint, { method: 'POST', headers: headers, json: payload }
    )
    const body = await response.json()

    if (response.status !== 200)
        throw new IntegrationError(
            "Error while fetching the Advertiser's audiences", body.errors[0].title, response.status
        )

    return body.data.id
}

