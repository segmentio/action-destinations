const API_VERSION = 'v53.0'

const leadDataShape = (payload: any) => {
    return {
        json: {
            LastName: payload.last_name,
            Company: payload.company,
            FirstName: payload.first_name,
            State: payload.state,
            Street: payload.street,
            Country: payload.country,
            PostalCode: payload.postal_code,
            City: payload.city,
            Email: payload.email  
        }
    }
}

const getInsertDataShape = (object: string, payload: any) => {
    const mapObjectToDataShape = {
        'Lead': leadDataShape(payload)
    }    
    return mapObjectToDataShape[object]
}

export const lookupRecordId = async (instanceUrl:string, criteria: string, value: string) => {

}

export const insertRecord = async (request, instanceUrl:string, object: string, payload: any) => {
    return request(`${instanceUrl}/services/data/${API_VERSION}/sobjects/${object}`, getInsertDataShape(object, payload))
}

export const updateRecord = async (instanceUrl:string, object: string) =>  {

}