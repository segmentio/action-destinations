// Type which describes JSON to send to Marketo
export type MarketoJSON = {
    input: [
        {
            leadFormFields: Record<string, string | number | boolean>
            visitorData: {
                email: string
            } & Record<string, string | number | boolean>
            cookie?: string
        }
    ]
    formId: string
}

// Response-level error: appears in the top-level `errors[]` array with `success: false`.
// Means the WHOLE request failed (nothing was processed). `code` is a string e.g. "602".
export interface MarketoResponseError {
    code: string
    message: string
}

// Record-level error: appears in `result[].reasons[]` with `success: true`.
// Means the request succeeded but an INDIVIDUAL record was skipped. `code` e.g. "1004".
export interface MarketoRecordError {
    code: string
    message: string
}

// A single record-level result inside the `result` array of a submitForm response.
// On failure `status` is "skipped" and `reasons` explains why.
export interface MarketoResultItem {
    id?: number
    status?: 'created' | 'updated' | 'skipped' | string
    reasons?: MarketoRecordError[]
}

// Top-level shape of a Marketo REST submitForm response.
// NOTE: Marketo returns HTTP 200 even on failure, surfacing the real error at one of
// two levels: response-level (`errors`) or record-level (`result[].reasons`).
export interface MarketoSubmitFormResponse {
    requestId: string
    success: boolean
    errors?: MarketoResponseError[]
    result?: MarketoResultItem[]
}
