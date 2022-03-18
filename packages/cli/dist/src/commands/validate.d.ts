import { Command, flags } from '@oclif/command'
import { DestinationDefinition } from '../lib/destinations'
export default class Validate extends Command {
  private spinner
  private isInvalid
  static description: string
  static examples: string[]
  static flags: flags.Input<any>
  static args: never[]
  run(): Promise<void>
  validateActions(destination: DestinationDefinition): Error[]
  validatePresets(destination: DestinationDefinition): Error[]
  validateFQL(fql: string): Error | null
  catch(error: unknown): Promise<void>
}
