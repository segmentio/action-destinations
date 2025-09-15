export declare class UpolloClient {
  private readonly upollo
  constructor(projectApiKey: string, options?: unknown)
  track(
    userinfo?: UpUser,
    eventtype?: number // eventtype is a proto enum, but we cant use those types here.
  ): Promise<void>
  assess(
    userinfo?: UpUser,
    eventtype?: number
  ): Promise<{
    emailAnalysis?: {
      company?: { name: string; industry: string; companySize: { employeesMin: number; employeesMax: number } }
    }
  }>
  checkEmail(email: string): Promise<{
    valid: boolean
    company?: { name: string; industry: string; companySize: { employeesMin: number; employeesMax: number } }
  }>
}

export interface UpUser {
  userId?: string
  userEmail?: string
  userPhone?: string
  userName?: string
  userImage?: string
  customerSuppliedValues?: Record<string, string>
}
