/**
 * Utility module for hashing values using various encryption methods and digest types.
 * It includes functionality to check if a value is already hashed and to process hashing with optional cleaning.
 */
import btoa from 'btoa-lite'

export type EncryptionMethod = 'sha1' | 'sha224' | 'sha256' | 'sha384' | 'sha512'
export const hashConfigs: {
  [key in EncryptionMethod]: { lengthHex: number; lengthBase64: number }
} = {
  sha1: { lengthHex: 40, lengthBase64: 28 },
  sha224: { lengthHex: 56, lengthBase64: 40 },
  sha256: { lengthHex: 64, lengthBase64: 44 },
  sha384: { lengthHex: 96, lengthBase64: 64 },
  sha512: { lengthHex: 128, lengthBase64: 88 }
}

export const DigestTypes = ['hex', 'base64'] as const
export type DigestType = typeof DigestTypes[number]

type CleaningFunction = (value: string) => string

class SmartHashing {
  private preHashed: boolean

  /**
   * Creates an instance of SmartHashing.
   * @param encryptionMethod - The method of encryption to be used.
   * @param digest - The type of digest to be used.
   */
  constructor(public encryptionMethod: EncryptionMethod = 'sha256', public digest: DigestType = 'hex') {
    this.preHashed = false
  }

  isAlreadyHashed(value: string): boolean {
    const config = hashConfigs[this.encryptionMethod]
    if (!config) throw new Error(`Unsupported encryption method: ${this.encryptionMethod}`)

    let regex: RegExp
    switch (this.digest) {
      case 'hex':
        regex = new RegExp(`^[a-f0-9]{${config.lengthHex}}$`, 'i')
        this.preHashed = value.length === config.lengthHex && regex.test(value)
        break
      case 'base64':
        regex = new RegExp(`^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$`)
        this.preHashed = value.length === config.lengthBase64 && regex.test(value)
        break
      default:
        throw new Error(`Unsupported digest type: ${this.digest}`)
    }

    return this.preHashed
  }

  async hash(value: string): Promise<string> {
    if (value.trim() === '') {
      throw new Error('Cannot hash an empty string')
    }

    if (this.preHashed) {
      return value
    }

    const hash = await createHash(value, this.encryptionMethod, this.digest)

    return hash
  }
}

export async function createHash(
  value: string,
  encryptionMethod: EncryptionMethod = 'sha256',
  digest: DigestType = 'hex'
): Promise<string> {
  const algo = encryptionMethod.toUpperCase().replace(/^SHA(\d+)$/, 'SHA-$1')
  const encoded = new TextEncoder().encode(value);
  const hashBuffer = await window.crypto.subtle.digest(algo, encoded)
  const hashArray = new Uint8Array(hashBuffer)

  return digest === 'hex' ? toHex(hashArray) : toBase64(hashArray)
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function toBase64(bytes: Uint8Array): string {
  const binary = String.fromCharCode(...bytes)
  return btoa(binary)
}

/**
 * Processes the hashing of a given value based on the provided encryption method, digest type, features, and optional cleaning function.
 *
 * @param value - The string value to be hashed.
 * @param encryptionMethod - The method of encryption to be used.
 * @param digest - The type of digest to be used.
 * @param cleaningFunction - An optional function to clean the value before hashing.
 * @returns The hashed value or the original value if it is already hashed.
 */

export async function processHashing(
  value: string,
  encryptionMethod: EncryptionMethod,
  digest: DigestType,
  cleaningFunction?: CleaningFunction
): Promise<string> {
  if (value.trim() === '') {
    return ''
  }

  const smartHashing = new SmartHashing(encryptionMethod, digest)

  if (smartHashing.isAlreadyHashed(value)) {
    return value
  }

  if (cleaningFunction) {
    value = cleaningFunction(value)
  }
  return smartHashing.hash(value)
}

export async function smartHash(value: string, normalizeFunction?: (value: string) => string): Promise<string> {
  return await processHashing(value, 'sha256', 'hex', normalizeFunction)
}

function normalize(value: string, allowedChars: RegExp, trim = true): string {
  let normalized = value.toLowerCase().replace(allowedChars, '')
  if (trim) normalized = normalized.trim()
  return normalized
}

const emailAllowed = /[^a-z0-9.@+-]/g

export function normalizeEmail(email: string): string {
  return normalize(email, emailAllowed)
}
