import { Command, flags } from '@oclif/command'
export default class Init extends Command {
  private spinner
  static description: string
  static examples: string[]
  static flags: flags.Input<any>
  static args: {
    name: string
    description: string
  }[]
  parseFlags(): import('@oclif/parser').Output<
    {
      [x: string]: any
    },
    {
      [name: string]: any
    }
  >
  run(): Promise<void>
  catch(error: unknown): Promise<void>
}
