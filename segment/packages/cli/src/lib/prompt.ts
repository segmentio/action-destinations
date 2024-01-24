import { flags } from '@oclif/command'
import prompts from 'prompts'

const onCancel = () => {
  process.exit(0)
}

// TODO fix these types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function prompt<Answers = { [key: string]: any }>(
  questions: prompts.PromptObject | Array<prompts.PromptObject>,
  options: prompts.Options = {}
): Promise<Answers> {
  return prompts(questions, { onCancel, ...options }) as Promise<Answers>
}

/**
 * Given a set of parsed flags and questions, only prompt for answers that are missing
 */
export async function autoPrompt<F extends flags.Output>(
  flags: Partial<F> & { [key: string]: unknown },
  questions: prompts.PromptObject | Array<prompts.PromptObject>
) {
  if (!Array.isArray(questions)) {
    questions = [questions]
  }

  for (const question of questions) {
    const name = question.name as string
    if (typeof flags[name] !== 'undefined') {
      // Set the prompt not to appear
      question.type = null
      question.initial = flags[name]
    }
  }

  const answers = await prompt(questions)

  return {
    ...flags,
    // TODO fix the types to be accurate
    ...(answers as F)
  }
}
