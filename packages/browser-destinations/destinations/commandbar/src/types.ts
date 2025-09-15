export type ModalFormFactor = { type: 'modal' }
export type InlineFormFactor = { type: 'inline'; rootElement: string | HTMLElement }

export type FormFactorConfig = ModalFormFactor | InlineFormFactor

export type UserAttributes = Record<string, unknown>

export type InstanceAttributes = {
  canOpenEditor: boolean
  hmac?: string
  formFactor: FormFactorConfig
}

export type ContextLoader = (chosenValues?: undefined | Record<string, unknown[]>) => unknown

export type Metadata = Record<string, unknown>

export type CommandBarClientSDK = {
  boot(id: string, userAttributes?: UserAttributes, instanceAttributes?: Partial<InstanceAttributes>): Promise<void>

  addMetadataBatch(data: Metadata, addToUserProperties?: boolean): void

  trackEvent(key: string, properties: Metadata): void
}
