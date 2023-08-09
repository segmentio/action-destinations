import { InvalidAuthenticationError } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import path from 'path'
import { Settings } from '../generated-types'

const SFTP_SERVER = 'goacoustic.com'
const SFTP_PORT = 22

function validateSFTP(settings: Settings) {
  if (!settings.sftp_user) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Username)')
  }

  if (!settings.sftp_password) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing credentials (Password)')
  }

  if (!settings.sftp_folder) {
    throw new InvalidAuthenticationError('Selected SFTP upload mode, but missing SFTP folder path.')
  }
}

async function uploadSFTP(sftp: Client, settings: Settings, filename: string, fileContent: Buffer) {
  return doSFTP(sftp, settings, async (sftp) => {
    const targetPath = path.join(settings.sftp_folder as string, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function doSFTP(sftp: Client, settings: Settings, action: { (sftp: Client): Promise<unknown> }) {
  await sftp.connect({
    host: SFTP_SERVER,
    port: SFTP_PORT,
    username: settings.sftp_user,
    password: settings.sftp_password
  })

  const retVal = await action(sftp)
  await sftp.end()
  return retVal
}

async function testAuthenticationSFTP(sftp: Client, settings: Settings) {
  return doSFTP(sftp, settings, async (sftp) => {
    return sftp.exists(settings.sftp_folder as string).then((fileType) => {
      if (!fileType) throw new Error(`Could not find path: ${settings.sftp_folder}`)
    })
  })
}

export { validateSFTP, uploadSFTP, testAuthenticationSFTP, Client }
