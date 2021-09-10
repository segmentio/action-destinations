import execa from 'execa'

export const DIST_DIR = 'packages/browser-destinations/dist/web/'

export function webBundles(): { [destination: string]: string } {
  const command = `ls ${DIST_DIR}`
  const map: { [destination: string]: string } = {}
  const destinations = execa.commandSync(command).stdout

  destinations.split('\n').forEach((destination) => {
    map[destination] = execa.commandSync(`ls ${DIST_DIR}/${destination}`).stdout.split('\n')[0]
  })

  return map
}

export function build(env: string): string {
  execa.commandSync('lerna run build --scope @segment/destination-subscriptions')
  execa.commandSync('lerna run build --scope @segment/actions-core')
  execa.commandSync('lerna run build --scope @segment/destination-subscriptions')
  execa.commandSync(`rm -rf ${DIST_DIR}`)
  if (env === 'production') {
    return execa.commandSync('lerna run build-web').stdout
  }

  return execa.commandSync('lerna run build-web-stage').stdout
}
