import { UserData } from '../types'

export interface PurchaseJSON {
    data: [
        {
            event_name: 'Purchase',
            event_time: string,
            action_source: string,
            event_source_url?: string,
            event_id?: string,
            user_data: UserData,
            custom_data: {
                currency: string,
                value: number,
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
    ],
    test_event_code?: string
}