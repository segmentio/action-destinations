import { InvalidAuthenticationError } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import path from 'path'
import type { Payload } from './generated-types'

const LIVERAMP_SFTP_SERVER = 'files.liveramp.com'
const LIVERAMP_SFTP_PORT = 22
const sftp = new Client()

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

async function uploadSFTP(payload: Payload, filename: string, fileContent: Buffer) {
  sftp
    .connect({
      host: LIVERAMP_SFTP_SERVER,
      port: LIVERAMP_SFTP_PORT,
      username: payload.sftp_username,
      password: payload.sftp_password
    })
    .then(() => {
      const targetPath = path.join(payload.sftp_folder_path, filename)
      return sftp.put(fileContent, targetPath)
    })
    .then(() => {
      return sftp.end()
    })
    .catch((err) => {
      throw err
    })
}

export { validateSFTP, uploadSFTP }
