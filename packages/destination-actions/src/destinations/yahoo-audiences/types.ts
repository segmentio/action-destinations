export interface CredsObj {
  tx_client_key: string
  tx_client_secret: string
}

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
  schema: Array<string>
  data: Array<unknown>
  gdpr: boolean
  gdpr_euconsent?: string | undefined
}

export interface YahooSubTaxonomy {
  segment_audience_id: string
  segment_audience_key: string
  engage_space_id: string
  identifier: string
}
