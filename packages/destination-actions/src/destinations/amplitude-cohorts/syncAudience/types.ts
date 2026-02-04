export interface UpsertToCohortJSON {
    event_type: string
    time: string | number
    user_id?: string
    user_properties?: Record<string, unknown>
}