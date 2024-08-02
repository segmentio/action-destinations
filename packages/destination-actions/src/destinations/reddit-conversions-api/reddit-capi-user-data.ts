import { InputField } from '@segment/actions-core/destination-kit/types'
import { createHash } from 'crypto'
import { Payload } from './reportConversionEvent/generated-types'
import isEmpty from 'lodash/isEmpty'

// Define the user data field for Reddit
export const user_data_field: InputField = {
    label: 'User Data',
    description: 'The identifying user parameters associated with the conversion event.',
    type: 'object',
    properties: {
        aaid: {
            label: 'AAID',
            description: 'The AAID of the user\'s device.',
            type: 'string'
        },
        data_processing_options: {
            label: 'Data Processing Options',
            description: 'A structure of data processing options to specify the processing type for the event.',
            type: 'object',
            properties: {
                country: {
                    label: 'Country',
                    description: 'Country Code of the user. We support ISO 3166-1 alpha-2 country code.',
                    type: 'string'
                },
                modes: {
                    label: 'Modes',
                    description: 'Data Processing Mode for this conversion event. Currently we only support LDU (Limited Data Use).',
                    type: 'string',
                    multiple: true
                },
                region: {
                    label: 'Region',
                    description: 'Region Code of the user. We support ISO 3166-2 region code or just the region code without country prefix, e.g. CA.',
                    type: 'string'
                }
            }
        },
        email: {
            label: 'Email',
            description: 'The email address of the user.',
            type: 'string'
        },
        external_id: {
            label: 'External ID',
            description: 'An advertiser-assigned persistent identifier for the user.',
            type: 'string'
        },
        idfa: {
            label: 'IDFA',
            description: 'The IDFA of the user\'s device.',
            type: 'string'
        },
        ip_address: {
            label: 'IP Address',
            description: 'The IP address of the user.',
            type: 'string'
        },
        opt_out: {
            label: 'Opt Out',
            description: 'A flag indicating whether the user has opted out of tracking.',
            type: 'boolean'
        },
        screen_dimensions: {
            label: 'Screen Dimensions',
            description: 'The dimensions of the user\'s screen.',
            type: 'object',
            properties: {
                height: {
                    label: 'Height',
                    description: 'The height of the user\'s screen in pixels. This must be positive and less than 32768.',
                    type: 'integer'
                },
                width: {
                    label: 'Width',
                    description: 'The width of the user\'s screen in pixels. This must be positive and less than 32768.',
                    type: 'integer'
                }
            }
        },
        user_agent: {
            label: 'User Agent',
            description: 'The user agent of the user\'s browser.',
            type: 'string'
        },
        uuid: {
            label: 'UUID',
            description: 'The value from the first-party Pixel \'_rdt_uuid\' cookie on your domain. Note that it is in the \'{timestamp}.{uuid}\' format. You may use the full value or just the UUID portion.',
            type: 'string'
        }
    }
}

type UserData = Pick<Payload, 'user_data'>

const hash = (value: string | undefined): string | undefined => {
    if (value === undefined) return

    const hash = createHash('sha256')
    hash.update(value)
    return hash.digest('hex')
}

export const normalisedAndHashed = (payload: UserData) => {
    if (payload.user_data) {
        if (payload.user_data.email && !isEmpty(payload.user_data.email)) {
            payload.user_data.email = hash(payload.user_data.email.replace(/\s/g, '').toLowerCase()) ?? undefined
        }

        if (payload.user_data.external_id && !isEmpty(payload.user_data.external_id)) {
            payload.user_data.external_id = hash(payload.user_data.external_id.replace(/\s/g, '').toLowerCase()) ?? undefined
        }

        if (payload.user_data.idfa && !isEmpty(payload.user_data.idfa)) {
            payload.user_data.idfa = hash(payload.user_data.idfa.replace(/\s/g, '').toLowerCase()) ?? undefined
        }

        if (payload.user_data.aaid && !isEmpty(payload.user_data.aaid)) {
            payload.user_data.aaid = hash(payload.user_data.aaid.replace(/\s/g, '').toLowerCase()) ?? undefined
        }
    }
}

export const hash_user_data = (payload: UserData): Object => {
    normalisedAndHashed(payload)
    return {
        email: payload.user_data?.email,
        external_id: payload.user_data?.external_id,
        idfa: payload.user_data?.idfa,
        aaid: payload.user_data?.aaid,
        ip_address: payload.user_data?.ip_address,
        opt_out: payload.user_data?.opt_out,
        screen_dimensions: payload.user_data?.screen_dimensions,
        user_agent: payload.user_data?.user_agent,
        uuid: payload.user_data?.uuid,
        data_processing_options: payload.user_data?.data_processing_options
    }
}