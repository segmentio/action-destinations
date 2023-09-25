export interface TaxonomyObject {
  id: string
  name: string
  description: string
  users: {
    include: [string]
  }
  subTaxonomy: [
    {
      id: string
      name: string
      type: string
    }
  ]
}

export interface YahooPayload {
  Schema: Array<string>
  Data: Array<unknown>
  gdpr: boolean
  gdpr_euconsent?: string | undefined
}
