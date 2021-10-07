import type { BrowserActionDefinition } from '../../../lib/browser-destinations'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

export const friendbuyLocalStorageKey = 'persist:friendbuy-msdk-06192019-root'

// Change from unknown to the partner SDK types
const action: BrowserActionDefinition<Settings, unknown, Payload> = {
  title: 'Profile',
  description: 'Attaches the Friendbuy profile to browser events',
  platform: 'web',
  defaultSubscription: 'type = "track" or type = "identify"',
  fields: {},
  lifecycleHook: 'enrichment',
  perform: (_client, { context }) => {
    const ls = window.localStorage
    try {
      const friendbuyLocalStorageJson = ls.getItem(friendbuyLocalStorageKey)
      if (!friendbuyLocalStorageJson) {
        return
      }
      const trackerJson = JSON.parse(friendbuyLocalStorageJson).tracker
      if (!trackerJson) {
        return
      }
      const profile = JSON.parse(trackerJson).tracker
      if (!profile) {
        return
      }
      context.updateEvent('integrations.Actions Friendbuy.profile', profile)
    } catch (e) {
      /* comment to prevent eslint from complaining that block is empty */
    }
  }
}

export default action
