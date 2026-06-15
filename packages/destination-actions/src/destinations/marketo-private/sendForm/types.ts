// Type which desribes JSON to send to Marketo

export type MarketoJSON = {
    input: [
        {
            leadFormFields: Record<string, string | number | boolean>
            visitorData: Record<string, string | number | boolean>, // needs to include email 
            cookie: string
        }
    ],
    formId: string
}