import { PayloadValidationError, RequestTimeoutError, Logger, IntegrationError } from '@segment/actions-core'
import path from 'path'
import Client from 'ssh2-sftp-client'
import { SFTP_DEFAULT_PORT } from './constants'
import { Settings } from './generated-types'
import { sftpConnectionConfig } from './types'
import { SFTPWrapper } from './client'

enum SFTPErrorCode {
  NO_SUCH_FILE = 2
}

interface SFTPError extends Error {
  code: number
}

/**
 * Uploads a file to the specified SFTP folder path.
 *
 * @param settings - The SFTP connection settings.
 * @param sftpFolderPath - The target folder path on the SFTP server.
 * @param filename - The name of the file to upload.
 * @param fileContent - The content of the file to upload as a Buffer.
 * @returns A promise that resolves when the file is successfully uploaded.
 */
async function uploadSFTP(
  settings: Settings,
  sftpFolderPath: string,
  filename: string,
  fileContent: Buffer,
  useConcurrentWrites?: boolean,
  logger?: Logger,
  signal?: AbortSignal
) {
  const sftp = new SFTPWrapper('uploadSFTP', logger)
  signal?.throwIfAborted()
  const abortListener = () => {
    sftp.end().catch(() => {
      logger?.warn('Failed to close SFTP connection')
    })
    throw new RequestTimeoutError()
  }
  signal?.addEventListener('abort', abortListener, { once: true })
  try {
    await sftp.connect(createConnectionConfig(settings))
    const remoteFilePath = path.posix.join(sftpFolderPath, filename)
    if (useConcurrentWrites) {
      return await sftp.fastPutFromBuffer(fileContent, remoteFilePath)
    } else {
      return await sftp.put(fileContent, remoteFilePath)
    }
  } catch (e) {
    formatAndThrowError(e, sftpFolderPath)
  } finally {
    // Clean up the SFTP connection and abort listener
    await sftp.end()
    signal?.removeEventListener('abort', abortListener)
  }
}

function createConnectionConfig(settings: Settings): sftpConnectionConfig {
  const { auth_type, sftp_ssh_key, sftp_password } = settings
  const credentialKey = auth_type === 'ssh_key' ? 'privateKey' : 'password'
  const credentialValue = auth_type === 'ssh_key' ? normalizeSSHKey(sftp_ssh_key) : sftp_password

  return {
    host: settings.sftp_host,
    port: settings.sftp_port || SFTP_DEFAULT_PORT,
    username: settings.sftp_username,
    [credentialKey]: credentialValue
  }
}

/**
 * Normalizes an SSH private key by ensuring proper PEM formatting.
 * Handles SSH keys that have been copied/pasted from a file into the text fields.
 */
function normalizeSSHKey(key = ''): string {
  if (!key) return key

  /*
   * Remove any extra whitespace and normalize line endings:
   * - \r\n -> \n (Windows CRLF to Unix LF)
   * - \r -> \n (Old Mac CR to Unix LF)
   */
  const normalizedKey = key.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n')

  /*
   * Check if it's already properly formatted (has proper header/footer with line breaks)
   * This regex pattern breaks down as:
   * - -----BEGIN [A-Z\s]+PRIVATE KEY-----  : Matches the PEM header (e.g., "-----BEGIN RSA PRIVATE KEY-----") // gitleaks:allow
   *   - [A-Z\s]+ matches one or more uppercase letters or spaces (RSA, DSA, EC, etc.)
   * - \n                                   : Followed by a newline
   * - [\s\S]*?                            : Non-greedy match of any characters (including newlines)
   *   - \s matches whitespace, \S matches non-whitespace, *? is non-greedy quantifier
   * - \n                                   : Followed by a newline
   * - -----END [A-Z\s]+PRIVATE KEY-----    : Matches the PEM footer with same key type
   */
  const properFormat = /-----BEGIN [A-Z\s]+PRIVATE KEY-----\n[\s\S]*?\n-----END [A-Z\s]+PRIVATE KEY-----/
  const hasProperFormat = properFormat.test(normalizedKey)

  if (hasProperFormat) return normalizedKey

  /*
   * Look for header and footer patterns to identify malformed keys
   * This regex captures the entire header line:
   * - (-----BEGIN [A-Z\s]+PRIVATE KEY-----)
   *   - Parentheses create a capture group for later extraction
   *   - [A-Z\s]+ matches key types like "RSA", "DSA", "EC", "OPENSSH", etc.
   */
  const headerMatch = normalizedKey.match(/(-----BEGIN [A-Z\s]+PRIVATE KEY-----)/)

  /*
   * Similar pattern for the footer:
   * - (-----END [A-Z\s]+PRIVATE KEY-----)
   *   - Must match the same key type as the header for valid PEM format
   */
  const footerMatch = normalizedKey.match(/(-----END [A-Z\s]+PRIVATE KEY-----)/)

  /* If both header and footer are found, reformat the key */
  if (headerMatch && footerMatch) {
    const header = headerMatch[1]
    const footer = footerMatch[1]

    /*
     * Extract the key content between header and footer
     * .replace(/\s/g, '') removes ALL whitespace characters:
     * - \s matches any whitespace: spaces, tabs, newlines, carriage returns
     * - g flag means global - replace all occurrences, not just the first
     */
    const keyContent = normalizedKey.replace(header, '').replace(footer, '').replace(/\s/g, '')

    /*
     * Split into 64-character lines using regex
     * /.{64}/g breaks down as:
     * - . matches any character except newline
     * - {64} means exactly 64 characters
     * - g flag means global - find all matches, not just the first
     *
     * '$&\n' in replacement string:
     * - $& represents the entire matched string (the 64 characters)
     * - \n adds a newline after each 64-character chunk
     *
     * .replace(/\n$/, '') removes trailing newline:
     * - \n$ matches a newline at the end of the string ($ = end anchor)
     */
    const formattedContent = keyContent.replace(/.{64}/g, '$&\n').replace(/\n$/, '')

    /* Reconstruct with proper formatting */
    return `${header}\n${formattedContent}\n${footer}`
  }

  /* If we can't parse it, return as-is and let the SSH library handle/reject it */
  return normalizedKey
}

/**
 * Tests the SFTP connection using the provided settings.
 */
async function testSFTPConnection(settings: Settings): Promise<unknown> {
  const sftp = new Client()
  let res
  try {
    await sftp.connect(createConnectionConfig(settings))
    res = await sftp.list('/')
  } catch (e) {
    formatAndThrowError(e)
  } finally {
    await sftp.end()
  }
  return res
}

function formatAndThrowError(e: any, path = '/'): never {
  const sftpError = e as SFTPError
  if (sftpError) {
    if (sftpError.code === SFTPErrorCode.NO_SUCH_FILE) {
      throw new PayloadValidationError(`Could not find path: ${path}`)
    }
  }
  throw new IntegrationError(`SFTP Error: ${e.message}`, 'SFTP_ERROR', 500)
}

export { normalizeSSHKey, testSFTPConnection, uploadSFTP }
