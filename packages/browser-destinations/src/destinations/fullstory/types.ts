import * as FullStory from '@fullstory/browser'

export type FS = typeof FullStory & {
  // setVars is not available on the FS client yet.
  setVars: (eventName: string, eventProperties: object) => {}
}
