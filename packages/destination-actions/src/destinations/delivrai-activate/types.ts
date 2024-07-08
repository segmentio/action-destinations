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

export interface DelivrAIPayload {
  audience_key: string,
  data: Array<unknown>,
  client_identifier_id:string
}

