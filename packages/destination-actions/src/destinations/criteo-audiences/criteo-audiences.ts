import { RequestOptions, IntegrationError } from '@segment/actions-core'

const BASE_API_URL = 'https://api.criteo.com/2022-01'

export type RequestFn = (url: string, options?: RequestOptions) => Promise<Response>

export type Operation = {
    operation_type: string,
    audience_id: string,
    user_list: string[]
}

export const patchAudience = async (
    request: RequestFn,
    operation: Operation
): Promise<Response> => {

    if (operation.operation_type !== "add" && operation.operation_type !== "remove")
        throw new Error(`Incorrect operation type: ${operation}`)
    if (isNaN(+operation.audience_id))
        throw new IntegrationError('The Audience ID should be a number', 'Invalid input', 400)

    const endpoint = `${BASE_API_URL}/audiences/${operation.audience_id}/contactlist`

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

    // TODO Authentication
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ` + 'authToken'//placeholder for now. but this will be oauth2 token from authentication
    }

    return request(
        endpoint,
        {
            method: 'PATCH',
            json: payload,
            headers: headers
        }
    )

}

export const getAdvertiserAudiences = async (
    request: RequestFn,
    advertiser_id: string
): Promise<Array<Record<string, any>>> => {
    if (isNaN(+advertiser_id))
        throw new IntegrationError('The Advertiser ID should be a number', 'Invalid input', 400)

    const endpoint = `${BASE_API_URL}/audiences?advertiser-id=${advertiser_id}`
    // TODO Authentication
    const headers = {
        authorization: `Bearer `,
    }

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
    audience_name: string
): Promise<string> => {
    if (!audience_name)
        throw new IntegrationError('Invalid Audience Key', 'Invalid input', 400)

    const advertiser_audiences = await getAdvertiserAudiences(request, advertiser_id)

    advertiser_audiences.array.forEach(audience => {
        if (audience.attributes.name === audience_name)
            return audience.id
    });

    return await createAudience(request, advertiser_id, audience_name)
}

export const createAudience = async (
    request: RequestFn,
    advertiser_id: string,
    audience_name: string
): Promise<string> => {
    const endpoint = `${BASE_API_URL}/audiences`

    // TODO Authentication
    const headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer `,
    }

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

