export interface Credentials {
  accessKeyId: string
  secretAccessKey: string
  sessionToken: string
}

export interface Data {
  rawMapping: RawMapping
}

export interface RawMapping {
  columns: {
    [k: string]: unknown
  }
}

export interface ColumnHeader {
  cleanName: string 
  originalName: string
}
