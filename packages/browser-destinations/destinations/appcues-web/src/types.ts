declare global {
  interface Window {
    Appcues: Appcues
    AppcuesSettings: AppcuesSettings
  }
}

export interface Appcues {
  track(event_name: string, properties?: Properties): void
  identify(userId: string, traits?: Properties): void
  group(groupId: string, traits?: Properties): void
  page(): void
}

export interface AppcuesSettings {
  enableURLDetection: boolean
}

export type Properties = {
  [k: string]: unknown
}