
export interface JSON {
    email: string
    fields: {
        phone?: string
        company?: string
        name?: string
        [key: string]: unknown
    }
}

export interface LeadFieldsResponse {
    data: {
        id: string
        label: string
        type: string
        name: string
    }[]
}