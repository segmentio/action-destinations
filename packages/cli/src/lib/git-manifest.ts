import execa from 'execa'
import zlib from 'zlib'
import { DIST_DIR } from './web-bundles'

function getSha(): string {
  return execa.commandSync('git rev-parse --short HEAD').stdout.trim()
}

export function createShaManifestFile(manifest: { [library: string]: string }): void {
  const body = JSON.stringify(manifest)
  const gzippedBody = zlib.gzipSync(body)

  const jsonFile = `${DIST_DIR}/manifest-${getSha()}.json`
  const gzippedJsonFile = `${DIST_DIR}/manifest-${getSha()}.json.gz}`

  execa.commandSync(`touch ${jsonFile}`)
  execa.commandSync(`touch ${gzippedJsonFile}`)

  execa.commandSync(`echo ${body} >> ${jsonFile}`)
  execa.commandSync(`echo ${gzippedBody} >> ${gzippedJsonFile}`)
}
