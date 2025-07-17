import {
  DEFAULT_REQUEST_TIMEOUT,
  InvalidAuthenticationError,
  PayloadValidationError,
  SelfTimeoutError
} from '@segment/actions-core'

import path from 'path'
import Client from 'ssh2-sftp-client'
import { Payload } from './generated-types'

enum SFTPErrorCode {
  NO_SUCH_FILE = 2
}

interface SFTPError extends Error {
  code: number
}

function validateSFTP(payload: Payload) {
  if (!payload.sftp_username) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Username)')
  }

  if (!payload.sftp_password) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Password)')
  }

  if (!payload.sftp_host) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing SFTP host')
  }

  if (!payload.sftp_folder_path) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing SFTP folder path')
  }
}

async function uploadSFTP(sftp: Client, payload: Payload, filename: string, fileContent: Buffer) {
  return doSFTP(sftp, payload, async (sftp) => {
    const targetPath = path.join(payload.sftp_folder_path, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function doSFTP(sftp: Client, payload: Payload, action: { (sftp: Client): Promise<unknown> }) {
  await sftp.connect({
    host: payload.sftp_host,
    port: payload.sftp_port || 22,
    username: payload.sftp_username,
    password: payload.sftp_password
  })

  let timeoutError
  const timeout = setTimeout(() => {
    void sftp.end().catch((err) => {
      console.error(err)
    }) // hang promise on purpose, we are on fault hot path, but also catch the error to avoid an unhandledRejection
    timeoutError = new SelfTimeoutError(
      `did not complete SFTP operation under allotted time: ${DEFAULT_REQUEST_TIMEOUT}`
    )
  }, DEFAULT_REQUEST_TIMEOUT)

  let retVal
  try {
    retVal = await action(sftp)
    if (timeoutError) throw timeoutError
  } catch (e: unknown) {
    const sftpError = e as SFTPError
    if (sftpError) {
      if (sftpError.code == SFTPErrorCode.NO_SUCH_FILE) {
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

async function testAuthenticationSFTP(sftp: Client, payload: Payload) {
  return doSFTP(sftp, payload, async (sftp) => {
    return sftp.exists(payload.sftp_folder_path).then((fileType) => {
      if (!fileType) throw new PayloadValidationError(`Could not find path: ${payload.sftp_folder_path}`)
    })
  })
}

export { Client, doSFTP, testAuthenticationSFTP, uploadSFTP, validateSFTP }
