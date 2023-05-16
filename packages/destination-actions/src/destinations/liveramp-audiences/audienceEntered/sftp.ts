import { InvalidAuthenticationError } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import path from 'path'
import { Settings } from '../generated-types'

const LIVERAMP_SFTP_SERVER = 'files.liveramp.com'
const LIVERAMP_SFTP_PORT = 22
const sftp = new Client()

function validateSFTP(settings: Settings) {
  if (!settings.sftp_username) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Username)')
  }

  if (!settings.sftp_password) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Password)')
  }

  if (!settings.sftp_folder_path) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing SFTP folder path.')
  }
}

async function uploadSFTP(settings: Settings, filename: string, fileContent: Buffer) {
  sftp
    .connect({
      host: LIVERAMP_SFTP_SERVER,
      port: LIVERAMP_SFTP_PORT,
      username: settings.sftp_username,
      password: settings.sftp_password
    })
    .then(() => {
      const targetPath = path.join(settings.sftp_folder_path as string, filename)
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
