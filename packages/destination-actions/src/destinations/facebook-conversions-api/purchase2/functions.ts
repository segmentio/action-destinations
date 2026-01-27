import {  ErrorCodes, IntegrationError, PayloadValidationError, RequestClient, Features, StatsContext } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { CURRENCY_ISO_CODES } from '../constants'
import { get_api_version } from '../utils'
import { validateContents, dataProcessingOptions } from '../fb-capi-properties'
import { getUserData } from '../fb-capi-user-data'
import { generate_app_data } from '../fb-capi-app-data'
import { RequestJSON, PurchaseEventData, AppendValueEventData } from './types'

export function send(request: RequestClient, payload: Payload, settings: Settings, features?: Features, statsContext?: StatsContext) {
    
    const { 
        is_append_event,
        append_event_details: { 
            original_event_time,
            original_event_order_id,
            original_event_id,
            net_revenue_to_append,
            predicted_ltv_to_append
        } = {},
        currency,
        event_time,
        action_source,
        event_source_url,
        event_id,
        order_id,
        user_data,
        custom_data, 
        value,
        net_revenue, 
        predicted_ltv,
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
    
    if(
        is_append_event && 
        (!original_event_time || !original_event_order_id || !original_event_id) 
        && (typeof net_revenue_to_append !== 'number' && typeof predicted_ltv_to_append !== 'number')
    ) {
        throw new PayloadValidationError('If append event is true, original event time, original event order ID, original event ID, and at least one of net revenue to append or predicted lifetime value to append must be provided')
    }

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

    const testEventCode = test_event_code || settings.testEventCode

    const purchaseEventData =(): PurchaseEventData => {
        return {
            event_name: 'Purchase',
            event_time,
            action_source,
            ...(event_source_url && { event_source_url }),
            ...(event_id && { event_id }),
            user_data: getUserData(user_data),
            custom_data: {
                ...custom_data,
                currency,
                value,
                ...(order_id && { order_id }),
                ...(typeof net_revenue === 'number' && { net_revenue }),
                ...(typeof predicted_ltv === 'number' && { predicted_ltv }),
                ...(Array.isArray(content_ids) && content_ids.length > 0 && { content_ids }),
                ...(content_name && { content_name }),
                ...(content_type && { content_type }),
                ...(contents && { contents }),
                ...(typeof num_items === 'number' && { num_items })
            },
            ...(() => {
                const app_data = generate_app_data(app_data_field)
                return app_data ? { app_data }: {}
            })(),
            ...(data_processing_options ? { data_processing_options: ['LDU'] } : {}),
            ...(data_processing_options ? { data_processing_options_country: data_processing_options_country || 0 } : {}  ),
            ...(data_processing_options ? { data_processing_options_state: data_processing_options_state || 0 } : {}  )
        }
    }

    const appendValueEventData =(): AppendValueEventData => {
        const data = purchaseEventData()
        const { order_id, ...customDataWithoutOrderId } = data.custom_data;
        return {
            ...data,
            event_name: 'AppendValue',
            custom_data: {
                ...customDataWithoutOrderId,
                net_revenue: net_revenue_to_append,
                predicted_ltv: predicted_ltv_to_append
            },
            original_event_data: {
                event_name: 'Purchase',
                event_time: original_event_time as string,
                order_id: original_event_order_id,
                event_id: original_event_id                 
            }
        }
    }

    const json: RequestJSON = {
        data: [is_append_event ? appendValueEventData() : purchaseEventData()],
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