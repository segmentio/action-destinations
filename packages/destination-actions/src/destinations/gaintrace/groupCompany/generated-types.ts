// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The customer's own identifier for the company. GainTrace upserts on this value.
   */
  groupId: string
  /**
   * The display name of the company. Falls back to the Company ID when absent.
   */
  name?: string
  /**
   * The primary web domain of the company, for example "acme.com".
   */
  domain?: string
  /**
   * The industry the company operates in.
   */
  industry?: string
  /**
   * The number of employees at the company.
   */
  employeeCount?: number
  /**
   * The plan or tier the company is on.
   */
  plan?: string
}
