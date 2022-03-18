declare type PayloadWithCustomFields = {
  custom_fields?: {
    [k: string]: unknown
  }
}
export declare function addCustomFieldsFromPayloadToEntity<E>(payload: PayloadWithCustomFields, entity: E): void
export {}
