export interface Credentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

export interface SingleData {
  rawMapping: RawMapping
}

export interface BatchData {
  rawMapping: RawMapping[]
}

export interface RawMapping {
  columns: {
    [k: string]: unknown
  }
}
