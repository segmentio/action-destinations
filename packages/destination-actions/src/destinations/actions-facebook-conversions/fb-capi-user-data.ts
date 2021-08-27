import { InputField } from "@segment/actions-core/src/destination-kit/types"

// Implementation of Facebook user data object
// https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/customer-information-parameters

export const user_data: InputField = {
    label: 'User Data',
    description: 'User Data',
    type: 'object',
    properties: {
        email: {
            label: 'Email',
            description: 'User Email',
            type: 'string'
        },
        phone: {
            label: 'Phone',
            description: 'User phone number',
            type: 'string'
        },
        gender: {
            label: 'Gender',
            description: 'User gender',
            type: 'string'
        },
        client_user_agent: {
            label: 'Client User Agent',
            description: 'Client User Agent',
            type: 'string'
        }
    }
}

// TODO: Can we check if these values are hashed with SHA256?
// FB will reject if we send non hashed values for many of these
export interface UserData {
    em?: string
    ph?: string
    ge?: string
    db?: string
    ln?: string
    fn?: string
    ct?: string
    state?: string
    zp?: string
    country?: string
    external_id?: string
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string
    fbp?: string
    subscription_id?: string
    lead_id?: string
    fb_login_id?: string
}