import {
  DEFAULT_REQUEST_TIMEOUT,
  InvalidAuthenticationError,
  PayloadValidationError,
  SelfTimeoutError
} from '@segment/actions-core'

import path from 'path'
import Client from 'ssh2-sftp-client'
import { Settings } from './generated-types'
import { Payload } from './syncToSFTP/generated-types'

enum SFTPErrorCode {
  NO_SUCH_FILE = 2
}

interface SFTPError extends Error {
  code: number
}

function validateSFTP(settings: Settings, payload: Payload) {
  if (!settings.sftp_username) {
    throw new InvalidAuthenticationError('Missing Required SFTP Credentials (Username)')
  }

  if (!settings.sftp_password) {
    throw new InvalidAuthenticationError('Missing Required SFTP Credentials (Password)')
  }

  if (!settings.sftp_host) {
    throw new InvalidAuthenticationError('Missing Required SFTP host')
  }

  if (!payload.sftp_folder_path) {
    throw new InvalidAuthenticationError('Missing Required SFTP folder path')
  }
}

async function uploadSFTP(settings: Settings, payload: Payload, filename: string, fileContent: Buffer) {
  const sftp = new Client()
  return executeSFTPOperation(sftp, settings, payload, async (sftp) => {
    const targetPath = path.join(payload.sftp_folder_path, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function executeSFTPOperation(
  sftp: Client,
  settings: Settings,
  payload: Payload,
  action: { (sftp: Client): Promise<unknown> }
) {
  await sftp.connect({
    host: settings.sftp_host,
    port: settings.sftp_port || 22,
    username: settings.sftp_username,
    password: settings.sftp_password
  })

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
        throw new PayloadValidationError(`Could not find path: ${payload.sftp_folder_path}`)
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

export { Client, executeSFTPOperation, uploadSFTP, validateSFTP }
