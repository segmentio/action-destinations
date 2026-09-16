export const CONSENT_STATUS_GRANTED = 'CONSENT_STATUS_GRANTED' as const
export const CONSENT_STATUS_DENIED = 'CONSENT_STATUS_DENIED' as const
export const CONTACT_INFO = 'CUSTOMER_MATCH_CONTACT_INFO' as const
export const DEVICE_ID = 'CUSTOMER_MATCH_DEVICE_ID' as const

// Four different fields are labelled Audience Type: the mapping field, the audience setting,
// and the hook's input and output. Error messages have to say which one they mean, so the
// labels live here and are used both to define the fields and to talk about them.
export const AUDIENCE_TYPE_LABEL = 'Audience Type'
export const RETL_HOOK_LABEL = 'Select or create an audience in Display & Video 360'
