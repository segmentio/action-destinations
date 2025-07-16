export interface UserGroupJSON {
    // required fields
    audience_id: string 
    audience_name: string
    action: boolean // true for add, false for remove
    timestamp: string

    // optional fields
    livelike_profile_id?: string
    user_id?: string
    user_group_id?: string
}