import { PayloadValidationError, RequestTimeoutError } from '@segment/actions-core'
import path from 'path'
import Client from 'ssh2-sftp-client'
import { SFTP_DEFAULT_PORT } from './constants'
import { Settings } from './generated-types'
import { sftpConnectionConfig } from './types'
import sftp from 'ssh2-sftp-client'
import ssh2 from 'ssh2'
import { Logger } from '@segment/actions-core'

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
  const sftp = new SFTPWrapper('uploadSFTP', signal, logger)
  try {
    await sftp.connect(createConnectionConfig(settings))
    const remoteFilePath = path.posix.join(sftpFolderPath, filename)
    if (useConcurrentWrites) {
      return await sftp.fastPutFromBuffer(fileContent, remoteFilePath)
    } else {
      return await sftp.put(fileContent, remoteFilePath)
    }
  } finally {
    // Clean up the SFTP connection and abort listener
    await sftp.end()
  }
}

async function executeSFTPOperation(
  sftp: Client,
  settings: Settings,
  sftpFolderPath: string,
  action: { (sftp: Client): Promise<unknown> },
  signal?: AbortSignal
) {
  const connectionConfig = createConnectionConfig(settings)
  await sftp.connect(connectionConfig)

  const abortSFTP = async () => {
    await sftp.end()
    throw new RequestTimeoutError()
  }

  if (signal) {
    if (signal.aborted) {
      await abortSFTP()
    }
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    signal.addEventListener('abort', abortSFTP, { once: true })
  }

  let retVal
  try {
    retVal = await action(sftp)
  } catch (e: unknown) {
    const sftpError = e as SFTPError
    if (sftpError) {
      if (sftpError.code === SFTPErrorCode.NO_SUCH_FILE) {
        throw new PayloadValidationError(`Could not find path: ${sftpFolderPath}`)
      }
    }
    throw e
  } finally {
    await sftp.end()
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    signal?.removeEventListener('abort', abortSFTP)
  }

  return retVal
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
  return executeSFTPOperation(
    sftp,
    settings,
    '/',
    async (sftp) => {
      // Simply attempt to list the root directory to test connection
      // This is a minimal operation that tests authentication and basic connectivity
      return sftp.list('/')
    },
    AbortSignal.timeout(10000)
  ) // 10 second timeout for test connection
}

// SFTP Wrapper class to handle SFTP operations with abort signal and logging
/* eslint-disable @typescript-eslint/no-unsafe-call */
export class SFTPWrapper {
  private readonly sftp: sftp
  private client: ssh2.SFTPWrapper
  private readonly signal?: AbortSignal
  private readonly logger?: Logger
  private abortHandler?: () => void

  constructor(name?: string, signal?: AbortSignal, logger?: Logger) {
    this.sftp = new Client(name)
    this.signal = signal
    this.logger = logger
  }

  private addAbortListener() {
    // If the signal is already aborted, throw immediately
    if (this.signal?.aborted) throw new RequestTimeoutError()

    // Store the handler so we can remove it later (only add once)
    if (!this.abortHandler) {
      this.abortHandler = () => {
        // Reject all pending operations
        const error = new RequestTimeoutError()
        // Close the SFTP connection
        this.sftp.end().catch((err: unknown) => {
          this.logger?.warn('Unexpected error while closing SFTP connection during abort:', String(err))
        })
        throw error
      }

      this.signal?.addEventListener('abort', this.abortHandler, { once: true })
    }
  }

  private removeAbortListener() {
    if (this.abortHandler && this.signal) {
      this.signal.removeEventListener('abort', this.abortHandler)
      this.abortHandler = undefined
    }
  }

  async connect(options: sftp.ConnectOptions) {
    this.addAbortListener()
    try {
      this.client = await this.sftp.connect(options)
      return this.client
    } catch (error) {
      this.logger?.error('Error connecting to SFTP server:', String(error))
      throw error
    }
  }

  async put(buffer: Buffer, remoteFilePath: string, options: sftp.TransferOptions = {}): Promise<string> {
    if (!this.client) {
      throw new Error('SFTP Client not connected. Call connect first.')
    }

    this.addAbortListener()

    try {
      return await this.sftp.put(buffer, remoteFilePath, options)
    } catch (error) {
      this.logger?.error('Error uploading file to SFTP server:', String(error))
      throw error
    }
  }

  async fastPutFromBuffer(
    input: Buffer,
    remoteFilePath: string,
    options: sftp.FastPutTransferOptions = {
      concurrency: 64,
      chunkSize: 32768
    }
  ): Promise<void> {
    if (!this.client) {
      throw new Error('SFTP Client not connected. Call connect first.')
    }
    this.addAbortListener()
    try {
      return this._fastXferFromBuffer(input, remoteFilePath, options)
    } catch (error) {
      this.logger?.error('Error uploading buffer to SFTP server:', String(error))
      throw error
    }
  }

  private async _fastXferFromBuffer(
    input: Buffer,
    remoteFilePath: string,
    options: sftp.FastPutTransferOptions
  ): Promise<void> {
    const fsize = input.length
    return new Promise<void>((resolve, reject) => {
      this.client.open(remoteFilePath, 'w', (err, handle) => {
        if (err) {
          return reject(new Error(`Error opening remote file: ${err.message}`))
        }
        const concurrency = options.concurrency || 64
        const chunkSize = options.chunkSize || 32768
        const readBuffer = input
        const writeBuffer = Buffer.alloc(chunkSize)
        let position = 0
        let writeRequests: Promise<void>[] = []

        const writeChunk = (chunkPos: number): Promise<void> => {
          return new Promise((chunkResolve, chunkReject) => {
            const bytesToWrite = Math.min(chunkSize, fsize - chunkPos)
            if (bytesToWrite <= 0) {
              return chunkResolve()
            }
            readBuffer.copy(writeBuffer, 0, chunkPos, chunkPos + bytesToWrite)
            this.client.write(handle, writeBuffer, 0, bytesToWrite, chunkPos, (writeErr) => {
              if (writeErr) {
                return chunkReject(new Error(`Error writing to remote file: ${writeErr.message}`))
              }
              chunkResolve()
            })
          })
        }

        const processWrites = async () => {
          while (position < fsize) {
            writeRequests.push(writeChunk(position))
            position += chunkSize
            if (writeRequests.length >= concurrency) {
              await Promise.all(writeRequests)
              writeRequests = []
              options?.step?.(Math.min(position, fsize), chunkSize, fsize)
            }
          }
          await Promise.all(writeRequests)
        }

        processWrites()
          .then(() => resolve())
          .catch((err) => reject(err))
          .finally(() => {
            this.client.close(handle, (closeErr) => {
              if (closeErr) {
                this.logger?.warn('Error closing remote file handle:', String(closeErr.message))
              }
            })
          })
      })
    })
  }

  async end() {
    this.removeAbortListener()
    return this.sftp.end()
  }
}

export { Client, executeSFTPOperation, normalizeSSHKey, testSFTPConnection, uploadSFTP }
