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
