export type Iterate = (command: Command, ...args: unknown[]) => void

export enum Command {
  Event = 'event',
  Install = 'install',
  Identify = 'identify',
  OnResponse = 'onResponse',
  OnLoad = 'onLoad',
  onClose = 'onClose',
  Uninstall = 'uninstall'
}

export type IterateApi = {
  (): void
  q: unknown[]
  command: (args: unknown[]) => void
  loaded: boolean
}

export type IterateSettings = {
  apiKey: string
  installOnLoad?: boolean
}
