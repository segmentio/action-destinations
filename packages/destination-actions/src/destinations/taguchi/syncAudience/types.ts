export interface JSONItem {
    profile: {
        // The Taguchi ID of the organization to which this subscriber belongs. Must be an integer
        organizationId: number

        // Customer must select which of the 4 id types below to send. That ID type then becomes required. More than one ID can be sent at a time. 
        ref?: string 
        email?: string 
        phone?: string 
        id?: number 

        // Standard traits. All text fields. No specific formats for any of them. 
        title?: string
        firstname?: string
        lastname?: string
        dob?: string
        address?: string
        address2?: string
        address3?: string
        suburb?: string
        state?: string 
        country?: string 
        postcode?: string
        gender?: string


        // Custom traits. Including Computed Traits. 
        custom?: {
            [key: string]: unknown
        }

        // Audience details. Optional. 
        lists?: {
            listId: number
            subscribedTimestamp?: string
            unsubscribedTimestamp?: string 
            subscriptionOption: string | null // A customer-defined text or serialized JSON field. e.g. List description
        }[]
    }
}

export type JSON = JSONItem[] 

export type ResponseJSON = {
    code: number 
    name: string
    description: string
}[]