import { Command, flags } from '@oclif/command'
export default class Serve extends Command {
  private spinner
  static description: string
  static examples: string[]
  static strict: boolean
  static args: never[]
  static flags: flags.Input<any>
  run(): Promise<void>
  catch(error: unknown): Promise<void>
}
