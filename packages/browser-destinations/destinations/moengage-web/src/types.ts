export interface MoengageSDK {
  trackEvent(event_name: string, attributes: Attributes): void
  setUserAttribute(attribute_name: string, attribute_value: unknown): void
  setFirstName(first_name: string): void
  setLastName(last_name: string): void
  setEmailId(email: string): void
  setMobileNumber(mobile: string): void
  setUserName(user_name: string): void
  setGender(gender: string): void
  setBirthDate(birthday: Date): void
  logoutUser(): void
  callWebPush(config: unknown): void
  identifyUser(identifiers: string | Identifiers): void
  getUserIdentities(): Record<string, unknown>
  onsite(): void
  initialized: boolean
}

export interface Attributes {
  [key: string]: unknown
}

export interface Identifiers {
  [k: string]: string
}

export interface InitConfig {
  appId: string
  env: string
  projectId?: string
  enableSPA?: boolean
  disableOnsite?: boolean
  customProxyDomain?: string
  botsList?: string[]
  disableCookies?: boolean
  disableSdk?: boolean
  swPath?: string
  cards?: {
    enable: boolean
    placeholder?: string
    webFloating?: {
      enable: boolean
    }
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
