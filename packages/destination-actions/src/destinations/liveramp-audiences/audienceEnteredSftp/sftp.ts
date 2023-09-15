import {
  InvalidAuthenticationError,
  PayloadValidationError,
  SelfTimeoutError,
  DEFAULT_REQUEST_TIMEOUT
} from '@segment/actions-core'

import Client from 'ssh2-sftp-client'
import path from 'path'
import { Payload } from './generated-types'

import { LIVERAMP_SFTP_SERVER, LIVERAMP_SFTP_PORT } from '../properties'

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

  if (!payload.sftp_folder_path) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing SFTP folder path.')
  }
}

async function uploadSFTP(sftp: Client, payload: Payload, filename: string, fileContent: Buffer) {
  return doSFTP(sftp, payload, async (sftp) => {
    const targetPath = path.join(payload.sftp_folder_path as string, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function doSFTP(sftp: Client, payload: Payload, action: { (sftp: Client): Promise<unknown> }) {
  await sftp.connect({
    host: LIVERAMP_SFTP_SERVER,
    port: LIVERAMP_SFTP_PORT,
    username: payload.sftp_username,
    password: payload.sftp_password
  })

  let connectionEnded = false // no chance of accessing internals with TypeScript, keep connection state externally
  const timeout = setTimeout(() => {
    if (!connectionEnded) {
      void sftp.end() // hang promise on purpose, we are on fault hot path
      connectionEnded = true
      throw new SelfTimeoutError(`did not complete SFTP operation under allotted time: ${DEFAULT_REQUEST_TIMEOUT}`)
    }
  }, DEFAULT_REQUEST_TIMEOUT)

  let retVal
  try {
    retVal = await action(sftp)
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
    if (!connectionEnded) {
      await sftp.end()
    }
  }

  return retVal
}

async function testAuthenticationSFTP(sftp: Client, payload: Payload) {
  return doSFTP(sftp, payload, async (sftp) => {
    return sftp.exists(payload.sftp_folder_path as string).then((fileType) => {
      if (!fileType) throw new PayloadValidationError(`Could not find path: ${payload.sftp_folder_path}`)
    })
  })
}

export { validateSFTP, uploadSFTP, testAuthenticationSFTP, Client }
