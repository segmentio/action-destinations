
export type AttributionEvent = Page | Screen | Track | Identify | Group | Alias

export type BaseEvent = {
    messageId?: string
    timestamp?: string
    userId?: string
    anonymousId?: string
    context?: {
        ip?: string
        userAgent?: string
        library?: {
            name: string
            version: string
        }
        [key: string]: unknown
    }
}

export type Page = BaseEvent & {
    type: 'page'
    name?: string
    properties?: Record<string, unknown>
    traits?: Record<string, unknown>
}

export type Screen = BaseEvent & {
    type: 'screen'
    name?: string
    properties?: Record<string, unknown>
    traits?: Record<string, unknown>
}

export type Track = BaseEvent & {
    type: 'track'
    event: string
    properties?: Record<string, unknown>
    traits?: Record<string, unknown>
}

export type Identify = BaseEvent & {
    type: 'identify'
    traits?: Record<string, unknown>
}

export type Group = BaseEvent & {
    type: 'group'
    traits?: Record<string, unknown>
}

export type Alias = BaseEvent & {
    type: 'alias'
    userId: string
    previousId?: string
}