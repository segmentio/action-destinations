import type { EncryptionMethod } from '../../../lib/hashing-utils'

export type HashAlgorithm = Extract<EncryptionMethod, 'sha256'>

export type Normalization = 'none' | 'lowercase' | 'trim' | 'lowercase_trim'

export interface ColumnTransform {
  algorithm?: HashAlgorithm
  normalize: Normalization
}

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
