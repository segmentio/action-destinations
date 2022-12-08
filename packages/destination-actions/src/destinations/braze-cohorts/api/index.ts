import type { RequestClient, ModifiedResponse } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from '../syncAudiences/generated-types'
import { CohortChanges } from '../cohortChanges'

interface APIResponse {
  message: string
}

export class SyncAudiences {
  request: RequestClient

  constructor(request: RequestClient) {
    this.request = request
  }

  async createCohort(settings: Settings, payload: Payload): Promise<ModifiedResponse<APIResponse>> {
    return this.request(`${settings.endpoint}/partners/segment/cohorts`, {
      method: 'POST',
      json: {
        partner_api_key: settings.endpoint.includes('eu')
          ? process.env.braze_cohorts_partner_api_key_eu
          : process.env.braze_cohorts_partner_api_key_us,
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
    { addUsers, removeUsers, hasAddUsers, hasRemoveUsers }: any
  ): Promise<ModifiedResponse> {
    const cohortChanges: Array<CohortChanges> = []
    if (hasAddUsers) {
      cohortChanges.push(addUsers)
    }
    if (hasRemoveUsers) {
      cohortChanges.push(removeUsers)
    }

    return this.request(`${settings.endpoint}/partners/segment/cohorts/users`, {
      method: 'POST',
      json: {
        partner_api_key: settings.endpoint.includes('eu')
          ? process.env.braze_cohorts_partner_api_key_eu
          : process.env.braze_cohorts_partner_api_key_us,
        client_secret: settings.client_secret,
        cohort_id: cohort_id,
        cohort_changes: cohortChanges
      }
    })
  }
}
