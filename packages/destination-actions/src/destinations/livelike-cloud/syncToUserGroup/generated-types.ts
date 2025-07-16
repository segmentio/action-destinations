// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
    audience_id: string
    audience_name: string
    action: boolean // true for add, false for remove
    timestamp: string // optional, defaults to current time

    livelike_profile_id?: string
    user_id?: string
    user_group_id?: string
    traits_or_properties?: Record<string, unknown>
}
