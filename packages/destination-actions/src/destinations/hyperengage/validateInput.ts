import { Settings } from './generated-types'
import random from 'lodash/random'

// Convert relevant input properties to Hyperengage properties
export const validateInput = (
  settings: Settings,
  input: Record<string, any>,
  event_type: 'track' | 'user_identify' | 'account_identify'
): any => {
  const properties: any = {
    api_key: settings.apiKey,
    workspace_key: settings.workspaceIdentifier,
    doc_encoding: 'UTF-8',
    src: 'segment_api',
    screen_resolution: '0',
    user_id: input?.user_id || input?.userId,
    account_id: input?.account_id || input?.accountId || input?.traits?.companyId || input?.traits?.company?.id,
    anonymous_id: input?.anonymousId || random(1000000000, 9999999999).toString(),
    ids: {},
    event_type: event_type,
    ...input
  }
  delete properties.event_name
  delete properties.userId
  delete properties.accountId
  delete properties.anonymousId

  // Get screen_resolution from the input screen width and height
  if (input?.screen) {
    const { width, height } = input.screen
    properties.screen_resolution = `${width || 0}x${height || 0}`
    properties.vp_size = `${width || 0}x${height || 0}`
    delete properties.screen
  }

  // Get the doc_title from the input url
  if (input?.url) {
    const urlPattern = new RegExp(
      '^(https?:\\/\\/)?' + // validate protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
        '(\\#[-a-z\\d_]*)?$',
      'i'
    )
    if (urlPattern.test(input.url)) {
      const url = new URL(input.url as string)
      properties.doc_host = url.host
    }
  }

  // Resolve local_tz_offset property, we can get local_tz_offset from the input context.timezone
  if (input?.timezone) {
    const offset = new Date().toLocaleString('en-US', { timeZone: input.timezone, timeZoneName: 'short' }).split(' ')[2]
    properties.local_tz_offset = offset
    delete properties.timezone
  }

  // Check if event property is present, we will use it as event_type
  if (input?.event_name && event_type === 'track') {
    properties.event_type = input?.event_name
    delete properties.event_name
  } else {
    properties.event_type = event_type
  }

  // Validate user properties
  if (event_type === 'user_identify') {
    properties.traits = {
      email: input?.email,
      name: input?.name,
      created_at: input?.created_at,
      ...properties.traits
    }

    // Create object if company_id is present in traits
    if (input?.traits?.company) {
      properties.company = {
        ...input.traits.company
      }
      delete properties.traits.company
    }
    // Delete unnecessary user properties
    delete properties.email
    delete properties.name
    delete properties.created_at
  }

  // Validate account properties
  if (event_type === 'account_identify') {
    properties.traits = {
      name: input?.name,
      created_at: input?.created_at,
      plan_name: input?.plan,
      industry: input?.industry,
      trial_start_date: input?.trial_start,
      trial_expiry_date: input?.trial_end,
      website: input?.website,
      ...properties.traits
    }
    delete properties.name
    delete properties.created_at
    delete properties.plan
    delete properties.industry
    delete properties.trial_start
    delete properties.trial_end
    delete properties.website
  }
  return properties
}
