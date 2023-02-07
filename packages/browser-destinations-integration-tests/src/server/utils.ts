import { readdirSync } from 'fs'
import path from 'path'

const ls = (dirPath: string) =>
  readdirSync(dirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name)

export const DESTINATIONS_DIST_WEB = path.join(__dirname, '../../../browser-destinations', 'dist', 'web')

export const listDestinations = () =>
  ls(DESTINATIONS_DIST_WEB).map((dirPath) => {
    const destinationDirPath = path.join(DESTINATIONS_DIST_WEB, dirPath)
    const fileName = readdirSync(destinationDirPath).find((el) => el.endsWith('js'))
    if (!fileName) throw new Error('Invariant: no .js file found.')
    return {
      dirPath: dirPath,
      fileName,
      filePath: path.join(destinationDirPath, fileName)
    }
  })
