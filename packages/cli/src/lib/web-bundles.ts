import execa from 'execa'

const DIST_DIR = 'packages/browser-destinations/dist/web/'

export function webBundles(): string[] {
  const command = `ls ${DIST_DIR}`
  const files = execa.commandSync(command).stdout
  return files.split('\n')
}

export async function build(env: string): Promise<string> {
  execa.commandSync('lerna run build')
  if (env === 'production') {
    return execa.commandSync('lerna run build-web').stdout
  }

  return execa.commandSync('lerna run build-web-stage').stdout
}

export async function buildVersions(version: string, directory: string): Promise<void> {
  if (version !== 'latest') {
    execa.commandSync(`cp -R ${DIST_DIR}${directory}/latest/ ${DIST_DIR}${directory}/${version}/`)
  }
}
