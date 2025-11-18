import { ModifiedResponse, RequestClient, DynamicFieldResponse } from '@segment/actions-core'
import type { Settings } from '../../generated-types'
import DDApi from '../dd-api'
import { Contact, Program, ProgramStatus, ProgramEnrolment, ProgramEnrolementJSON } from '../types'
import { DOTDIGITAL_API_VERSION } from '../../../versioning-info'

/**
 * Class representing the Dotdigital Enrolment API.
 * Extends the base Dotdigital API class.
 */
class DDEnrolmentApi extends DDApi {
  constructor(settings: Settings, client: RequestClient) {
    super(settings, client)
  }

  /**
   * Fetches active programs from the Dotdigital API.
   * @returns {Promise<DynamicFieldResponse>} A promise resolving to the list of active programs.
   */
  public async getPrograms(): Promise<DynamicFieldResponse> {
    const response: ModifiedResponse<Program[]> = await this.get<Program[]>(`/${DOTDIGITAL_API_VERSION}/programs`)
    const programs = response.data
    const choices = programs
      .filter((program: Program) => program.status === ProgramStatus.Active)
      .map((program: Program) => ({
        value: program.id.toString(),
        label: program.name
      }))
    return { choices }
  }

  /**
   * Enrols a contact into a program.
   * @param {string} programId - The ID of the program.
   * @param {Contact} contact - The contact to enrol.
   * @returns {Promise<ProgramEnrolment>} A promise resolving to the program enrolment details.
   */
  public async enrolContact(programId: string, contact: Contact): Promise<ProgramEnrolment> {
    const json: ProgramEnrolementJSON = {
      contacts: [contact.contactId],
      programId
    }
    const response: ModifiedResponse<ProgramEnrolment> = await this.post<ProgramEnrolment, ProgramEnrolementJSON>(
      `/${DOTDIGITAL_API_VERSION}/programs/enrolments`,
      json
    )
    return response.data
  }
}

export default DDEnrolmentApi
