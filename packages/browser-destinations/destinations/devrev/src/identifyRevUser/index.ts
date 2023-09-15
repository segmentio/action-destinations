import type { BrowserActionDefinition } from '@segment/browser-destination-runtime/types'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'

const action: BrowserActionDefinition<Settings, {}, Payload> = {
  title: 'Identify Rev User',
  description: 'Looks up User, Account and Workspace Refs from user traits and adds it to context.',
  platform: 'web',
  hidden: false,
  defaultSubscription: 'type = "identify"',
  fields: {
    userRef: {
      label: 'User Ref',
      type: 'string',
      required: false,
      description: 'User Ref, ideally mappable to external ref of a Rev User.',
      default: 'userRef'
    },
    accountRef: {
      label: 'Account Ref',
      type: 'string',
      required: false,
      description: 'Account Ref, ideally mappable to external ref of a Rev Account.',
      default: 'accountRef'
    },
    workspaceRef: {
      label: 'Workspace Ref',
      type: 'string',
      required: false,
      description: 'Workspace Ref, ideally mappable to external ref of a Rev Workspace.',
      default: 'workspaceRef'
    }
  },
  lifecycleHook: 'enrichment',
  perform: (_, { context, payload, analytics }) => {
    const traits = analytics.user()?.traits()
    if (!traits) return

    const userRef = payload.userRef ? traits[payload.userRef] : undefined
    const accountRef = payload.accountRef ? traits[payload.accountRef] : undefined
    const workspaceRef = payload.workspaceRef ? traits[payload.workspaceRef] : undefined

    if (userRef || accountRef || workspaceRef) {
      context.updateEvent('integrations.DevRev', {})

      if (userRef) {
        context.updateEvent('integrations.DevRev.userRef', userRef)
      }

      if (accountRef) {
        context.updateEvent('integrations.DevRev.accountRef', accountRef)
      }

      if (workspaceRef) {
        context.updateEvent('integrations.DevRev.workspaceRef', workspaceRef)
      }
    }

    return
  }
}

export default action
