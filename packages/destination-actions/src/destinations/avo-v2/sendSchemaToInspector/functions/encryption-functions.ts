/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line no-restricted-syntax -- We use createHash for KDF (key derivation), not PII hashing
import { createECDH, createCipheriv, createHash, randomBytes } from 'crypto'

function deriveKey(sharedSecret: Buffer): Buffer {
  // Simple SHA-256 hash of the shared secret
  // This is a standard way to derive a key from an ECDH shared secret
  // eslint-disable-next-line no-restricted-syntax
  return createHash('sha256').update(sharedSecret).digest()
}

/**
 * A pre-computed ECIES encryption session holding the ephemeral key material.
 * Reusing one session across multiple encryptValueWithSession calls is safe:
 * AES-256-GCM security requires only that (key, IV) pairs are unique — each
 * call generates a fresh random IV, so uniqueness is guaranteed even with a
 * shared derived key.
 */
export interface EncryptionSession {
  ephemeralPublicKey: Buffer
  derivedKey: Buffer
}

/**
 * Creates one EncryptionSession per recipient public key.
 * Generates the ephemeral ECDH key pair and derives the shared AES key once,
 * so that encryptValueWithSession can be called cheaply for every property value.
 */
export function createEncryptionSession(publicKey: string): EncryptionSession {
  const publicKeyStr = typeof publicKey === 'string' ? publicKey : String(publicKey)
  const recipientPublicKey = Buffer.from(publicKeyStr, 'hex')

  const ecdh = createECDH('prime256v1')
  ecdh.generateKeys()
  // Default to uncompressed format (65 bytes) for maximum compatibility
  const ephemeralPublicKey = ecdh.getPublicKey(null, 'uncompressed')
  const sharedSecret = ecdh.computeSecret(recipientPublicKey)
  const derivedKey = deriveKey(sharedSecret)

  return { ephemeralPublicKey, derivedKey }
}

/**
 * Encrypts a value using a pre-computed EncryptionSession (ECIES).
 * Cheaper than encryptValue because EC key generation and ECDH are done once
 * in createEncryptionSession rather than per value.
 *
 * SPECIFICATION (Standard Web Crypto Profile):
 * 1. Curve: prime256v1 (NIST P-256)
 * 2. Key Derivation (KDF): SHA-256(SharedSecret)
 * 3. Cipher: AES-256-GCM
 * 4. Serialization: [Version(1b)] + [EphemeralPubKey(65b)] + [IV(16b)] + [AuthTag(16b)] + [Ciphertext]
 *    Version 0x00 = Standard Web Profile
 *
 * @param value - The value to encrypt (any type - will be JSON stringified)
 * @param session - Pre-computed session from createEncryptionSession
 * @returns Base64-encoded encrypted string that can only be decrypted with the private key
 */
export function encryptValueWithSession(value: any, session: EncryptionSession): string {
  try {
    // Convert the value to a JSON string to support all types
    // Note: undefined is converted to null as it cannot be represented in JSON
    const stringValue = value === undefined ? 'null' : JSON.stringify(value)

    const { ephemeralPublicKey, derivedKey } = session

    // Encrypt using AES-256-GCM with a fresh random IV per value
    const iv = randomBytes(16)
    const cipher = createCipheriv('aes-256-gcm', derivedKey, iv)

    let encrypted = cipher.update(stringValue, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])
    const authTag = cipher.getAuthTag() // GCM Auth Tag (16 bytes)

    // Format: [Version(1)] + [Ephemeral Public Key] + [IV (16)] + [AuthTag (16)] + [Ciphertext]
    const version = Buffer.from([0x00]) // Version 0: Standard Web Profile
    const resultBuffer = Buffer.concat([version, ephemeralPublicKey, iv, authTag, encrypted])

    return resultBuffer.toString('base64')
  } catch (error) {
    throw new Error(
      `Failed to encrypt value. Please check that the public key is valid. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Encrypts a value using ECC public key encryption (ECIES).
 * The encrypted output can only be decrypted by the client using their private key.
 * This ensures that Avo cannot decrypt the values on the backend.
 *
 * When encrypting multiple values for the same public key, prefer
 * createEncryptionSession + encryptValueWithSession to avoid repeated EC key generation.
 *
 * @param value - The value to encrypt (any type - will be JSON stringified)
 * @param publicKey - The ECC public key in hex format provided by the client
 * @returns Base64-encoded encrypted string that can only be decrypted with the private key
 */
export function encryptValue(value: any, publicKey: string): string {
  return encryptValueWithSession(value, createEncryptionSession(publicKey))
}
