import { DEFAULT_REQUEST_TIMEOUT, PayloadValidationError, SelfTimeoutError } from '@segment/actions-core'
import path from 'path'
import Client from 'ssh2-sftp-client'
import { Settings } from './generated-types'
import { sftpConnectionConfig } from './types'

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
async function uploadSFTP(settings: Settings, sftpFolderPath: string, filename: string, fileContent: Buffer) {
  const sftp = new Client()
  return executeSFTPOperation(sftp, settings, sftpFolderPath, async (sftp) => {
    const targetPath = path.join(sftpFolderPath, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function executeSFTPOperation(
  sftp: Client,
  settings: Settings,
  sftpFolderPath: string,
  action: { (sftp: Client): Promise<unknown> }
) {
  const connectionConfig = createConnectionConfig(settings)
  await sftp.connect(connectionConfig)

  let timeoutError
  const timeout = setTimeout(() => {
    void sftp.end().catch((err) => {
      console.error(err)
    })
    timeoutError = new SelfTimeoutError(
      `Did not complete SFTP operation under allotted time: ${DEFAULT_REQUEST_TIMEOUT}`
    )
  }, DEFAULT_REQUEST_TIMEOUT)

  let retVal
  try {
    retVal = await action(sftp)
    if (timeoutError) throw timeoutError
  } catch (e: unknown) {
    const sftpError = e as SFTPError
    if (sftpError) {
      if (sftpError.code === SFTPErrorCode.NO_SUCH_FILE) {
        throw new PayloadValidationError(`Could not find path: ${sftpFolderPath}`)
      }
    }

    throw e
  } finally {
    clearTimeout(timeout)
    if (!timeoutError) {
      await sftp.end()
    }
  }

  return retVal
}

function createConnectionConfig(settings: Settings): sftpConnectionConfig {
  const { auth_type, sftp_ssh_key, sftp_password } = settings
  const credentialKey = auth_type === 'ssh_key' ? 'privateKey' : 'password'
  const credentialValue = auth_type === 'ssh_key' ? normalizeSSHKey(sftp_ssh_key) : sftp_password

  return {
    host: settings.sftp_host,
    port: settings.sftp_port || 22,
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

export { Client, executeSFTPOperation, normalizeSSHKey, uploadSFTP }
