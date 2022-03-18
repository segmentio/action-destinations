import { Command, flags } from '@oclif/command'
export default class GenerateAction extends Command {
  private spinner
  static description: string
  static examples: string[]
  static flags: {
    help: import('@oclif/parser/lib/flags').IBooleanFlag<void>
    force: import('@oclif/parser/lib/flags').IBooleanFlag<boolean>
    title: flags.IOptionFlag<string | undefined>
    directory: flags.IOptionFlag<string | undefined>
  }
  static args: {
    name: string
    description: string
    required: boolean
  }[]
  integrationDirs(glob: string): Promise<string[]>
  parseArgs(): import('@oclif/parser').Output<
    {
      help: void
      force: boolean
      title: string | undefined
      directory: string | undefined
    },
    {
      [name: string]: any
    }
  >
  run(): Promise<void>
  catch(error: unknown): Promise<void>
}
