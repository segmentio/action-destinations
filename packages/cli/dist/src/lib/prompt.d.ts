import { flags } from '@oclif/command'
import prompts from 'prompts'
export declare function prompt<
  Answers = {
    [key: string]: any
  }
>(questions: prompts.PromptObject | Array<prompts.PromptObject>, options?: prompts.Options): Promise<Answers>
export declare function autoPrompt<F extends flags.Output>(
  flags: Partial<F> & {
    [key: string]: unknown
  },
  questions: prompts.PromptObject | Array<prompts.PromptObject>
): Promise<
  Partial<F> & {
    [key: string]: unknown
  } & F
>
