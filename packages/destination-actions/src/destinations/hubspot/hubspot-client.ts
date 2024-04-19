import { Payload as ContactPayload } from './upsertContact/generated-types'
import { RequestClient, HTTPError } from '@segment/actions-core'
import { flattenObject } from './utils'
import { HUBSPOT_BASE_URL } from './properties'
import { TransactionContext } from '@segment/actions-core/destination-kit'

export interface SingleContactRequestBody {
    company?: string | undefined
    firstname?: string | undefined
    lastname?: string | undefined
    phone?: string | undefined
    address?: string | undefined
    city?: string | undefined
    state?: string | undefined
    country?: string | undefined
    zip?: string | undefined
    email?: string | undefined
    website?: string | undefined
    lifecyclestage?: string | undefined
    [key: string]: string | undefined
}

interface SingleContactSuccessResponse {
    id: string
    properties: Record<string, string | null>
}

interface BatchContactUpdateRequestBody extends Array<{ properties: SingleContactRequestBody, id: string }> {}

interface BatchContactCreateRequestBody extends Array<{ properties: SingleContactRequestBody}> {}

interface BatchContactReadRequestBody {
    properties: string[]
    idProperty: string
    inputs: Array<{ id: string }>
}

interface BatchContactReadResponse {
    status: string
    results: SingleContactSuccessResponse[]
    numErrors?: number
    errors?: SingleContactResponseError[]
    options: {
      body: string
      [key: string]: unknown
    }
}

interface SingleContactResponseError {
    status: string
    category: string
    message: string
    context: {
      ids: string[]
      [key: string]: unknown
    }
}

class HubspotClient {
    private _request: RequestClient
  
    constructor(request: RequestClient) {
      this._request = request
    }

    async createOrUpdateBatchContacts(createList: BatchContactCreateRequestBody, updateList: BatchContactUpdateRequestBody) { 
        if(createList.length>0){
            await this.createBatchContacts(createList)
        }
        if(updateList.length>0){
            const updateResponse = await this.updateBatchContacts(updateList)
            const results = updateResponse.data.results            
            const differences: { id: string; properties: { lifecyclestage: string } }[] = []
            const differences_reset: { id: string; properties: { lifecyclestage: string } }[] = []

            results.forEach((result) => {
                const request = updateList.find((req) => req.id === result.id)
                
                if (request && request.properties.lifecyclestage && (result.properties.lifecyclestage!==request.properties.lifecyclestage)) {
                    differences_reset.push({
                        id: request.id,
                        properties: {
                            lifecyclestage: ''
                        }
                    })
                    differences.push({
                        id: request.id,
                        properties: {
                            lifecyclestage: request.properties.lifecyclestage
                        }
                    })
                }
            })

            if (differences.length > 0) {
                // Reset Life Cycle Stage
                console.log(differences_reset)
                await this.updateBatchContacts(differences_reset)
                // Set the new Life Cycle Stage
                console.log(differences)
                await this.updateBatchContacts(differences)
            }
        }
    }

    private async updateBatchContacts(updateList: BatchContactUpdateRequestBody) {
        return await this._request<BatchContactReadResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/batch/update`, {
          method: 'POST',
          json: {
            inputs: updateList
          }
        })
    }

    private async createBatchContacts(createList: BatchContactCreateRequestBody) {
        return await this._request<BatchContactReadResponse>(`${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/batch/create`, {
          method: 'POST',
          json: {
            inputs: createList
          }
        })
    }

    buildBatchContactUpsertPayloads (payloads: ContactPayload[]): { updateList: BatchContactUpdateRequestBody, createList: BatchContactCreateRequestBody }{
        const updateList: BatchContactUpdateRequestBody = []
        const createList: BatchContactCreateRequestBody = []

        payloads.forEach((payload) => {    
            const requestPayload = {
                id: payload.canonical_id ?? undefined,
                properties: {
                  company: payload.company,
                  firstname: payload.firstname,
                  lastname: payload.lastname,
                  phone: payload.phone,
                  address: payload.address,
                  city: payload.city,
                  state: payload.state,
                  country: payload.country,
                  zip: payload.zip,
                  [payload.identifier_type as string]: payload.email,
                  website: payload.website,
                  lifecyclestage: payload.lifecyclestage?.toLowerCase() ?? undefined,
                  ...flattenObject(payload.properties)
                } as SingleContactRequestBody
            }
            if(requestPayload.id){
                updateList.push(requestPayload)
            } else {
                createList.push(requestPayload)
            }
        })

        return { updateList, createList }
    }

    async addCononicalIdToBatchPayloads(payloads: ContactPayload[]): Promise<ContactPayload[]>{
        
        payloads.forEach(payload => payload.identifier_type = payload.identifier_type ?? 'email')

        const unique_identify_types: string[] = Array.from(new Set(payloads.map(payload => payload.identifier_type as string))) ?? [];

        const requestPayloads: BatchContactReadRequestBody[] = []
        unique_identify_types.forEach(identifier_type => {
            const requestPayload: BatchContactReadRequestBody = {
                properties: [...new Set([...['email', 'lifecyclestage'], ...[identifier_type]])],
                idProperty: identifier_type,
                inputs: payloads
                    .filter(payload => payload.identifier_type === identifier_type)
                    .map(payload => { return {id: payload.email}})             
            }
            requestPayloads.push(requestPayload)
        }) 

        const promises = requestPayloads.map(payload => this.getBatchContacts(payload));

        const responses = await Promise.all(promises);

        unique_identify_types.forEach((identifier_type, index) => {
            
            responses[index].data.results.forEach((contactResponse) => {
                const canonical_id = contactResponse.id 
                const identifier_value = contactResponse.properties[identifier_type] as string
                payloads.filter(payload => payload.email == identifier_value).forEach(payload => payload.canonical_id = canonical_id);
            })
        });        
        return payloads
    }

    private async getBatchContacts(requestPayload: BatchContactReadRequestBody) {      
        return await this._request<BatchContactReadResponse>(
            `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/batch/read`, {
            method: 'POST',
            json: requestPayload
        })
    }

    private buildSingleContactRequestBody(payload: ContactPayload): SingleContactRequestBody {
        return {
            company: payload.company,
            firstname: payload.firstname,
            lastname: payload.lastname,
            phone: payload.phone,
            address: payload.address,
            city: payload.city,
            state: payload.state,
            country: payload.country,
            zip: payload.zip,
            [(payload.identifier_type as string) ?? 'email']: payload.email,
            website: payload.website,
            lifecyclestage: payload.lifecyclestage?.toLowerCase(),
            ...flattenObject(payload.properties)
          } as SingleContactRequestBody
    }

    private async updateSingleContact(properties: SingleContactRequestBody, identifierValue: string, identifier_type: string) {
        return await this._request<SingleContactSuccessResponse>(
          `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts/${identifierValue}?idProperty=${identifier_type}`,
          {
            method: 'PATCH',
            json: {
              properties: properties
            }
          }
        )
    }

    private async createSingleContact(properties: SingleContactRequestBody) {
        return await this._request<SingleContactSuccessResponse>(
            `${HUBSPOT_BASE_URL}/crm/v3/objects/contacts`, {
            method: 'POST',
            json: {
                properties
            }
        })
    }

    async createOrUpdateSingleContact(payload: ContactPayload, transactionContext: TransactionContext | undefined) { 
        const singleContactRequestBody = this.buildSingleContactRequestBody(payload)
        // An attempt is made to update contact with given properties. If HubSpot returns 404 indicating
        // the contact is not found, an attempt will be made to create contact with the given properties
        try {
            const { email: identifierValue, identifier_type = 'email' } = payload
            const response = await this.updateSingleContact(singleContactRequestBody, identifierValue, identifier_type)
    
            // cache contact_id for it to be available for company action
            transactionContext?.setTransaction('contact_id', response.data.id)
    
            // HubSpot returns the updated lifecylestage(LCS) as part of the response.
            // If the stage we are trying to set is backward than the current stage, it retains the current stage
            // and updates the timestamp. For determining if reset is required or not, we can compare
            // the stage returned in response with the desired stage . If they are not the same, reset
            // and update. More details - https://knowledge.hubspot.com/contacts/use-lifecycle-stages
            if (payload.lifecyclestage) {
                const currentLCS = response.data.properties['lifecyclestage']
                const hasLCSChanged = currentLCS === payload.lifecyclestage.toLowerCase()
                if (hasLCSChanged) return response
                // reset lifecycle stage
                await this.updateSingleContact({ ...singleContactRequestBody, lifecyclestage: ''}, identifierValue, identifier_type)
                // update contact again with new lifecycle stage
                return this.updateSingleContact(singleContactRequestBody, identifierValue, identifier_type)
            }
            return response
        } catch (ex) {
            if ((ex as HTTPError)?.response?.status == 404) {
            const result = await this.createSingleContact(singleContactRequestBody)
            // cache contact_id for it to be available for company action
            transactionContext?.setTransaction('contact_id', result.data.id)
            return result
            }
            throw ex
        }
    }
}
  
export default HubspotClient
  