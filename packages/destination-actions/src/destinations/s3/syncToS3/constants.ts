import { HashAlgorithm, Normalization } from './types'

export const SUPPORTED_HASH_ALGORITHMS: HashAlgorithm[] = ['sha256']

export const SUPPORTED_NORMALIZATIONS: Normalization[] = ['none', 'lowercase', 'trim', 'lowercase_trim']
