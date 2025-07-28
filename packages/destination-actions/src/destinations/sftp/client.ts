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
  const credentialValue = auth_type === 'ssh_key' ? sftp_ssh_key : sftp_password

  return {
    host: settings.sftp_host,
    port: settings.sftp_port || 22,
    username: settings.sftp_username,
    [credentialKey]: credentialValue
  }
}

export { Client, executeSFTPOperation, uploadSFTP }
