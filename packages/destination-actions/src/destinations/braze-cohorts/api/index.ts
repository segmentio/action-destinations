import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from '../syncAudiences/generated-types'
import { CohortChanges, UserAlias } from '../braze-cohorts-types'

interface APIResponse {
  message: string
}

export class SyncAudiences {
  request: RequestClient
  partnerApiKey: String

  constructor(request: RequestClient, settings: Settings) {
    this.request = request
    this.partnerApiKey = (
      settings.endpoint.includes('eu')
        ? process.env.BRAZE_COHORTS_PARTNER_API_KEY_EU
        : process.env.BRAZE_COHORTS_PARTNER_API_KEY_US
    ) as String
  }

  async createCohort(settings: Settings, payload: Payload): Promise<ModifiedResponse<APIResponse>> {
    return this.request(`${settings.endpoint}/partners/segment/cohorts`, {
      method: 'POST',
      json: {
        partner_api_key: this.partnerApiKey,
        client_secret: settings.client_secret,
        name: payload?.cohort_name,
        cohort_id: payload?.cohort_id,
        created_at: payload?.time
      }
    })
  }

  async batchUpdate(
    settings: Settings,
    cohort_id: string,
    cohortChanges: Array<CohortChanges>
  ): Promise<ModifiedResponse> {
    return this.request(`${settings.endpoint}/partners/segment/cohorts/users`, {
      method: 'POST',
      json: {
        partner_api_key: this.partnerApiKey,
        client_secret: settings.client_secret,
        cohort_id: cohort_id,
        cohort_changes: cohortChanges.map((change) => ({
          user_ids: toMayBeArray(change.user_ids),
          device_ids: toMayBeArray(change.device_ids),
          aliases: transformAliases(change.aliases),
          should_remove: change.should_remove
        }))
      }
    })
  }
}

function toMayBeArray<T>(set: Set<T> | undefined): T[] | undefined {
  return set ? Array.from(set) : undefined
}

function transformAliases(aliases: Map<string, UserAlias> | undefined): UserAlias[] | undefined {
  if (!aliases) return undefined
  return Array.from(aliases.values()).map((alias) => ({
    alias_name: alias.alias_name,
    alias_label: alias.alias_label
  }))
}
