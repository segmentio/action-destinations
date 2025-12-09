/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line no-restricted-syntax -- We use createHash for KDF (key derivation), not PII hashing
import { createECDH, createCipheriv, createHash, randomBytes } from 'crypto'

/**
 * Generates a new ECC key pair for encryption/decryption.
 * Uses prime256v1 (NIST P-256) curve which is standard for Web Crypto API.
 *
 * @returns An object containing the private and public keys as hex strings
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  // Generate a new random private key (32 bytes) via ECDH
  const ecdh = createECDH('prime256v1')
  ecdh.generateKeys()

  return {
    privateKey: ecdh.getPrivateKey('hex'),
    publicKey: ecdh.getPublicKey('hex')
  }
}

function deriveKey(sharedSecret: Buffer): Buffer {
  // Simple SHA-256 hash of the shared secret
  // This is a standard way to derive a key from an ECDH shared secret
  // eslint-disable-next-line no-restricted-syntax
  return createHash('sha256').update(sharedSecret).digest()
}

/**
 * Encrypts a value using ECC public key encryption (ECIES).
 * The encrypted output can only be decrypted by the client using their private key.
 * This ensures that Avo cannot decrypt the values on the backend.
 *
 * ECIES uses hybrid encryption (ECDH + AES-256-GCM) which provides:
 * - No message size limitations
 * - Fast encryption even for large values
 * - Strong authentication via GCM
 *
 * SPECIFICATION (Standard Web Crypto Profile):
 * 1. Curve: prime256v1 (NIST P-256)
 * 2. Key Derivation (KDF): SHA-256(SharedSecret)
 * 3. Cipher: AES-256-GCM
 * 4. Serialization: [Version(1b)] + [EphemeralPubKey(65b)] + [IV(16b)] + [AuthTag(16b)] + [Ciphertext]
 *    Version 0x00 = Standard Web Profile
 *
 * @param value - The value to encrypt (any type - will be JSON stringified)
 * @param publicKey - The ECC public key in hex format provided by the client
 * @returns Base64-encoded encrypted string that can only be decrypted with the private key
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encryptValue(value: any, publicKey: string): string {
  try {
    // Convert the value to a JSON string to support all types
    // Note: JSON.stringify(undefined) returns undefined (not a string), so handle it explicitly, undefined is converted to null as it cannot be represented in JSON
    const stringValue = value === undefined ? 'null' : JSON.stringify(value)

    if (stringValue === undefined) {
      throw new Error('Cannot encrypt undefined value')
    }

    // 1. Prepare Public Key
    // Ensure publicKey is a string
    const publicKeyStr = typeof publicKey === 'string' ? publicKey : String(publicKey)
    // Create buffer from hex string
    // Handle both compressed (33 bytes) and uncompressed (65 bytes) keys
    const recipientPublicKey = Buffer.from(publicKeyStr, 'hex')

    // 2. Generate Ephemeral Key Pair on prime256v1
    const ecdh = createECDH('prime256v1')
    ecdh.generateKeys()
    // Default to uncompressed format (65 bytes) for maximum compatibility
    const ephemeralPublicKey = ecdh.getPublicKey(null, 'uncompressed')

    // 3. Derive Shared Secret (ECDH)
    const sharedSecret = ecdh.computeSecret(recipientPublicKey)

    // 4. Key Derivation
    const derivedKey = deriveKey(sharedSecret)

    // 5. Encrypt using AES-256-GCM
    const iv = randomBytes(16) // Random IV
    const cipher = createCipheriv('aes-256-gcm', derivedKey, iv)

    let encrypted = cipher.update(stringValue, 'utf8')
    encrypted = Buffer.concat([encrypted, cipher.final()])
    const authTag = cipher.getAuthTag() // GCM Auth Tag (16 bytes)

    // 6. Serialize Output
    // Format: [Version(1)] + [Ephemeral Public Key] + [IV (16)] + [AuthTag (16)] + [Ciphertext]
    const version = Buffer.from([0x00]) // Version 1: Standard Web Profile
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
