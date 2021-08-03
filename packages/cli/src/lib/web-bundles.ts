import execa from 'execa'

export function webBundles(): string[] {
  const command = 'ls packages/browser-destinations/dist/web/'
  const files = execa.commandSync(command).stdout
  return files.split('\n')
}
