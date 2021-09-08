import execa from 'execa'

export const DIST_DIR = 'packages/browser-destinations/dist/web/'

export function webBundles(): string[] {
  const command = `ls ${DIST_DIR}`
  const files = execa.commandSync(command).stdout
  return files.split('\n')
}

export function build(env: string): string {
  execa.commandSync('lerna run build')
  if (env === 'production') {
    return execa.commandSync('lerna run build-web').stdout
  }

  return execa.commandSync('lerna run build-web-stage').stdout
}
