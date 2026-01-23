
export interface LeadJSON {
    email: string
    fields: {
        phone?: string
        company?: string
        name?: string
        [key: string]: unknown
    }
}

export interface CompanyJSON {
    domain: string
    fields: {
        [key: string]: unknown
    }
}

export interface LeadFieldsResponse {
    data: {
        data: {
            id: string
            label: string
            type: string
            name: string
        }[]
    }
}

export type LeadFieldType = 'string' | 'text' | 'picklist' | 'boolean' | 'decimal';