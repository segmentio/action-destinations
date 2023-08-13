// import { ErrorCodes, InvalidAuthenticationError } from '@segment/actions-core'
import Client from 'ssh2-sftp-client'
import path from 'path'
import { Settings } from '../generated-types'

const SFTP_SERVER = 'goacoustic.com'
const SFTP_PORT = 22

async function cache2SFTP(sftp: Client, settings: Settings, filename: string, fileContent: string) {
  return putSFTP(sftp, settings, async (sftp) => {
    const targetPath = path.join(settings.sftp_folder as string, filename)
    return sftp.put(fileContent, targetPath)
  })
}

async function putSFTP(sftp: Client, settings: Settings, putCall: { (sftp: Client): Promise<unknown> }) {
  await sftp.connect({
    host: SFTP_SERVER,
    port: SFTP_PORT,
    username: settings.sftp_user,
    password: settings.sftp_password
  })

  const retVal = await putCall(sftp)
  await sftp.end()
  return retVal
}

async function testAuthSFTP(sftp: Client, settings: Settings) {
  return putSFTP(sftp, settings, async (sftp) => {
    return sftp.exists(settings.sftp_folder as string).then((fileType) => {
      if (!fileType) throw new Error(`Could not find SFTP folder: ${settings.sftp_folder}`)
    })
  })
}

export { cache2SFTP, testAuthSFTP, Client }
