import { UserData } from '../types'

export interface RequestJSON {
    data: [PurchaseEventData | AppendValueEventData],
    test_event_code?: string
}

export interface PurchaseEventData {
    event_name: 'Purchase',
    event_time: string,
    action_source: string,
    event_source_url?: string,
    event_id?: string,
    user_data: UserData,
    custom_data: {
        currency: string,
        value: number,
        order_id?: string,
        net_revenue?: number,
        content_ids?: string[],
        content_name?: string,
        content_type?: string,
        contents?: Array<{
            id?: string,
            quantity?: number,
            item_price?: number, 
            delivery_category?: string
        }>,
        num_items?: number,
        [k: string]: unknown
    }, 
    app_data?: Record<string, unknown>, 
    data_processing_options: number | string[],
    data_processing_options_country: number | string[],
    data_processing_options_state: number | string[]
}

export type AppendValueEventData = Omit<PurchaseEventData, 'event_name'> & {
    event_name: 'AppendValue'
    original_event_data: {
        event_name: 'Purchase'
        event_time: string // original event time
        order_id?: string
        event_id?: string
    }
    custom_data: Omit<PurchaseEventData['custom_data'], 'order_id'> & {
        order_id?: never // make sure to never include order_id in custom_data
    }
}

