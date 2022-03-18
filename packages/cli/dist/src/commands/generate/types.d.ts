import { Command, flags } from '@oclif/command'
export default class GenerateTypes extends Command {
  static description: string
  static examples: string[]
  static strict: boolean
  static flags: flags.Input<any>
  static args: never[]
  run(): Promise<void>
  handleFile(file: string): Promise<void>
}
