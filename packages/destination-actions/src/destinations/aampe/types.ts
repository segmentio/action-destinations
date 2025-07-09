export interface UserEvent {
    contact_id: string
    event_name: string
    time: number
    timezone?: string
    metadata?: Record<string, unknown>
    event_id?: string
}

export interface UserProperty extends Omit<UserEvent, 'timezone'> {
    user_properties: Record<string, unknown>
}