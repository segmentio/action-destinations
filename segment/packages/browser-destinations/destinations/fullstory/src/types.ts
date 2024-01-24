import * as FullStory from '@fullstory/browser'

export const FSPackage = FullStory
export type FS = typeof FullStory & {
  // setVars is not available on the FS client yet.
  setVars: (eventName: string, eventProperties: object, source: string) => {}
  setUserVars: (eventProperties: object, source: string) => void
  event: (eventName: string, eventProperties: { [key: string]: unknown }, source: string) => void
  identify: (uid: string, customVars: FullStory.UserVars, source: string) => void
}
