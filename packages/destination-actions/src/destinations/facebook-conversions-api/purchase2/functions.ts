import {  ErrorCodes, IntegrationError, PayloadValidationError, RequestClient, Features, StatsContext } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { get_api_version } from '../utils'
import { validateContents, dataProcessingOptions } from '../fb-capi-properties'
import { getUserData } from '../fb-capi-user-data'
import { generate_app_data } from '../fb-capi-app-data'
import { PurchaseJSON } from './types'

export function send(request: RequestClient, payload: Payload, settings: Settings, features?: Features, statsContext?: StatsContext) {
    
    const { 
        currency,
        event_time,
        action_source,
        event_source_url,
        event_id,
        user_data,
        custom_data, 
        value,
        net_revenue, 
        content_ids, 
        content_name, 
        content_type, 
        contents, 
        num_items,
        app_data_field,
        test_event_code,
        data_processing_options,
        data_processing_options_country,
        data_processing_options_state
    } = payload
    
    
    if (!CURRENCY_ISO_CODES.has(currency)) {
        throw new IntegrationError(
            `${payload.currency} is not a valid currency code.`,
            ErrorCodes.INVALID_CURRENCY_CODE,
            400
        )
    }

    if (!user_data) {
        throw new PayloadValidationError('Must include at least one user data property')
    }

    if (action_source === 'website' && user_data.client_user_agent === undefined) {
        throw new PayloadValidationError('If action source is "Website" then client_user_agent must be defined')
    }

    if (contents) {
        const err = validateContents(contents)
        if (err) throw err
    }

    const [data_options, country_code, state_code] = dataProcessingOptions(
        data_processing_options,
        data_processing_options_country,
        data_processing_options_state
    )

    const testEventCode = test_event_code || settings.testEventCode

    const json: PurchaseJSON = {
        data: [
            {
                event_name: 'Purchase',
                event_time,
                action_source,
                event_source_url,
                event_id,
                user_data: getUserData(user_data),
                custom_data: {
                    ...custom_data,
                    currency,
                    value,
                    net_revenue,
                    content_ids,
                    content_name,
                    content_type,
                    contents,
                    num_items
                },
                app_data: generate_app_data(app_data_field),
                data_processing_options: data_options,
                data_processing_options_country: country_code,
                data_processing_options_state: state_code
            }
        ],
        ...(testEventCode && { test_event_code: testEventCode })
    }

    return request(
        `https://graph.facebook.com/v${get_api_version(features, statsContext)}/${settings.pixelId}/events`,
        {
            method: 'POST',
            json
        }
    )
}