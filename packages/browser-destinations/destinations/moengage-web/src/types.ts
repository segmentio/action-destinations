export interface MoengageSDK {
    track_event(event_name: string, attributes: Attributes) : void
    add_user_attribute(attribute_name: string, attribute_value: unknown) : void
    add_first_name(first_name: string) : void
    add_last_name(last_name: string) : void
    add_email(email: string) : void
    add_mobile(mobile: string) : void
    add_user_name(user_name: string) : void
    add_gender(gender: string) : void
    add_birthday(birthday: Date) : void
    destroy_session() : void
    call_web_push(config: unknown) : void
    identifyUser(identifiers: string | Identifiers) : void
    getUserIdentities() : Record<string, unknown>
    onsite(): void
}

export interface Attributes {
    [key: string]: unknown
}

export interface Identifiers {
    [k : string]: string 
}

export interface InitConfig {
    app_id: string,
    env: string,
    project_id?: string
    enableSPA?: boolean
    disable_onsite?: boolean
    customProxyDomain?: string
    bots_list?: string[]
    disableCookies?: boolean
    disableSdk?: boolean
    swPath?: string
    cards?: {
        enable: boolean,
        placeholder?: string,
        webFloating?: {
            enable: boolean
        },
        mWebFloating?: {
            enable: boolean
        }
    }
}

declare global {
    interface Window {
        Moengage?: MoengageSDK
        moe?: (config: InitConfig) => MoengageSDK
        moengage_q?: Array<{ f: string; a: unknown[] }>
        moengage_object?: string
    }
}