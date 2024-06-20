export interface PersonalizeAttributes {
  _id: string
  name: string
  key: string
  description: string
  project?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
  uid?: string
  createdByUserName?: string
  updatedByUserName?: string
}

export interface AttributesResponse {
  uid: string
  name: string
  key: string
  description: string
  _id?: string
  project?: string
  createdBy?: string
  updatedBy?: string
  createdAt?: string
  updatedAt?: string
  createdByUserName?: string
  updatedByUserName?: string
}
