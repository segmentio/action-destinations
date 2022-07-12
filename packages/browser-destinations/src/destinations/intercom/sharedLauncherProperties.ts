import { InputField } from '@segment/actions-core'

export const getLauncherProperties = (): Record<string, InputField> => ({
  hide_default_launcher: {
    description:
      'selectively show the chat widget. According to Intercom’s docs, you want to first hide the Messenger for all users inside their UI using Messenger settings. Then think about how you want to programmatically decide which users you’d like to show the widget to.',
    label: 'Hide Default Launcher',
    type: 'boolean',
    required: false,
    default: {
      '@path': '$.context.Intercom.hideDefaultLauncher'
    }
  }
})
