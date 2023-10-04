/* eslint-disable @typescript-eslint/no-explicit-any */

import { Settings } from './generated-types'
import { PayloadValidationError } from '@segment/actions-core'

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
    account_id: input?.account_id || input?.traits?.companyId || input?.traits?.company?.id,
    ids: {},
    event_type: event_type,
    ...input
  }
  delete properties.event_name

  // Get screen_resolution from the input screen width and height
  if (input?.screen) {
    const { width, height } = input.screen
    properties.screen_resolution = `${width || 0}x${height || 0}`
    properties.vp_size = `${width || 0}x${height || 0}`
    delete properties.screen
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
    if (input?.name) {
      properties.traits = {
        email: input?.email,
        name: input?.name,
        created_at: input?.created_at,
        ...properties.traits
      }
    } else if (input?.first_name || input?.last_name) {
      properties.traits = {
        email: input?.email,
        name: `${input?.first_name} ${input?.last_name}}`,
        created_at: input?.created_at,
        ...properties.traits
      }
    } else {
      throw new PayloadValidationError('Either name, or first_name and last_name must be provided.')
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
    delete properties.first_name
    delete properties.last_name
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
