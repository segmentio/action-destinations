import {  ErrorCodes, IntegrationError, PayloadValidationError, RequestClient, Features, StatsContext } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { get_api_version } from '../utils'
import { validateContents, dataProcessingOptions } from '../fb-capi-properties'
import { hash_user_data } from '../fb-capi-user-data'
import { generate_app_data } from '../fb-capi-app-data'

export function send(request: RequestClient, payload: Payload, settings: Settings, features?: Features, statsContext?: StatsContext) {
    if (!CURRENCY_ISO_CODES.has(payload.currency)) {
        throw new IntegrationError(
            `${payload.currency} is not a valid currency code.`,
            ErrorCodes.INVALID_CURRENCY_CODE,
            400
        )
    }

    if (!payload.user_data) {
        throw new PayloadValidationError('Must include at least one user data property')
    }

    if (payload.action_source === 'website' && payload.user_data.client_user_agent === undefined) {
        throw new PayloadValidationError('If action source is "Website" then client_user_agent must be defined')
    }

    if (payload.contents) {
        const err = validateContents(payload.contents)
        if (err) throw err
    }

    const [data_options, country_code, state_code] = dataProcessingOptions(
        payload.data_processing_options,
        payload.data_processing_options_country,
        payload.data_processing_options_state
    )

    const testEventCode = payload.test_event_code || settings.testEventCode

    return request(
        `https://graph.facebook.com/v${get_api_version(features, statsContext)}/${settings.pixelId}/events`,
        {
            method: 'POST',
            json: {
            data: [
                {
                event_name: 'Purchase',
                event_time: payload.event_time,
                action_source: payload.action_source,
                event_source_url: payload.event_source_url,
                event_id: payload.event_id,
                user_data: hash_user_data({ user_data: payload.user_data }),
                custom_data: {
                    ...payload.custom_data,
                    currency: payload.currency,
                    value: payload.value,
                    net_revenue: payload.net_revenue,
                    content_ids: payload.content_ids,
                    content_name: payload.content_name,
                    content_type: payload.content_type,
                    contents: payload.contents,
                    num_items: payload.num_items
                },
                app_data: generate_app_data(payload.app_data_field),
                data_processing_options: data_options,
                data_processing_options_country: country_code,
                data_processing_options_state: state_code
                }
            ],
            ...(testEventCode && { test_event_code: testEventCode })
            }
        }
    )
}