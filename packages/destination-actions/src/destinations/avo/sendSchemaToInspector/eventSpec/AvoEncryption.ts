/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line no-restricted-syntax -- We use createHash for KDF (key derivation), not PII hashing
import { createECDH, createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

/**
 * Generates a new ECC key pair for encryption/decryption.
 * Uses secp256k1 curve (P-256 family) which provides 128-bit security.
 *
 * @returns An object containing the private and public keys as hex strings
 */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  // Generate a new random private key (32 bytes) via ECDH
  const ecdh = createECDH('secp256k1')
  ecdh.generateKeys()

  return {
    privateKey: ecdh.getPrivateKey('hex'),
    publicKey: ecdh.getPublicKey('hex')
  }
}

function deriveKey(sharedSecret: Buffer): Buffer {
  // To match standard eciesjs/eciespy behavior:
  // - Use SHA-512 to hash the shared secret
  // - Take the first 32 bytes as the encryption key
  // Spec:
  // - Algorithm: AES-256-GCM
  // - KDF: HKDF or Hash(SharedSecret) -> encKey
  // - Here: sha512(sharedSecret).slice(0, 32)
  // eslint-disable-next-line no-restricted-syntax
  return createHash('sha512').update(sharedSecret).digest().subarray(0, 32)
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
 * SPECIFICATION (Compatible with eciesjs/eciespy defaults):
 * 1. Curve: secp256k1
 * 2. Key Derivation (KDF): SHA-512(shared_secret).slice(0, 32)
 * 3. Cipher: AES-256-GCM
 * 4. Serialization: [EphemeralPubKey(33b|65b)] + [IV(16b)] + [AuthTag(16b)] + [Ciphertext]
 *
 * @param value - The value to encrypt (any type - will be JSON stringified)
 * @param publicKey - The ECC public key in hex format provided by the client
 * @returns Base64-encoded encrypted string that can only be decrypted with the private key
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function encryptValue(value: any, publicKey: string): string {
  try {
    // Convert the value to a JSON string to support all types
    // Note: JSON.stringify(undefined) returns undefined (not a string), so handle it explicitly
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

    // 2. Generate Ephemeral Key Pair on secp256k1
    const ecdh = createECDH('secp256k1')
    ecdh.generateKeys()
    // Default to compressed format (33 bytes) for smaller payload
    const ephemeralPublicKey = ecdh.getPublicKey(null, 'compressed')

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
    // Common Format: [Ephemeral Public Key] + [IV (16)] + [AuthTag (16)] + [Ciphertext]
    // We need to match whatever the receiver expects.
    // eciesjs default serialization is: EphemeralPubKey + IV + Tag + Ciphertext
    const resultBuffer = Buffer.concat([ephemeralPublicKey, iv, authTag, encrypted])

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
 * Decrypts a value that was encrypted with encryptValue.
 *
 * @param encryptedValue - The base64-encoded encrypted string
 * @param privateKey - The ECC private key in hex format
 * @returns The original decrypted value (parsed from JSON)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function decryptValue(encryptedValue: string, privateKey: string): any {
  try {
    const encryptedBuffer = Buffer.from(encryptedValue, 'base64')

    // 1. Parse buffer components
    // Determine public key size based on first byte
    // 0x04 = Uncompressed (65 bytes), 0x02/0x03 = Compressed (33 bytes)
    const firstByte = encryptedBuffer[0]
    let pubKeySize = 65
    if (firstByte === 0x02 || firstByte === 0x03) {
      pubKeySize = 33
    }

    const ephemeralPublicKey = encryptedBuffer.slice(0, pubKeySize)
    const iv = encryptedBuffer.slice(pubKeySize, pubKeySize + 16)
    const authTag = encryptedBuffer.slice(pubKeySize + 16, pubKeySize + 32)
    const ciphertext = encryptedBuffer.slice(pubKeySize + 32)

    // 2. Prepare Private Key
    const ecdh = createECDH('secp256k1')
    ecdh.setPrivateKey(Buffer.from(privateKey, 'hex'))

    // 3. Derive Shared Secret
    const sharedSecret = ecdh.computeSecret(ephemeralPublicKey)

    // 4. Key Derivation
    const derivedKey = deriveKey(sharedSecret)

    // 5. Decrypt
    const decipher = createDecipheriv('aes-256-gcm', derivedKey, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(ciphertext)
    decrypted = Buffer.concat([decrypted, decipher.final()])

    const stringValue = decrypted.toString('utf8')
    return JSON.parse(stringValue)
  } catch (error) {
    throw new Error(
      `Failed to decrypt value. Please check that the private key is valid and matches the public key used for encryption. Error: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}
