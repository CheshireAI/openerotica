import { AppSchema } from '../srv/db/schema'
import { OPENAI_MODELS } from './adapters'

const MAX_TOKENS = 80

export const defaultPresets = {
  basic: {
    name: 'Simple',
    maxTokens: MAX_TOKENS,
    maxContextLength: 2048,
    repetitionPenalty: 1.08,
    repetitionPenaltySlope: 0.9,
    repetitionPenaltyRange: 1024,
    temp: 0.65,
    topK: 0,
    topP: 0.9,
    typicalP: 1,
    topA: 1,
    tailFreeSampling: 0.9,
    order: [0, 1, 2, 3, 4, 5, 6],
    frequencyPenalty: 0.7,
    presencePenalty: 0.7,
    gaslight: '',
    oaiModel: OPENAI_MODELS.Turbo,
    memoryDepth: 5,
    memoryContextLimit: 500,
    memoryReverseWeight: false,
  },
  novel_20BC: {
    name: 'Novel 20BC+',
    maxTokens: MAX_TOKENS,
    maxContextLength: 2048,
    repetitionPenalty: 1.055,
    repetitionPenaltyRange: 2048,
    repetitionPenaltySlope: 3.33,
    temp: 0.65,
    tailFreeSampling: 0.879,
    topK: 20,
    topP: 1,
    order: [0, 1, 2, 3],
  },
  novel_blueLighter: {
    name: 'Novel Blue Lighter',
    maxTokens: MAX_TOKENS,
    maxContextLength: 2048,
    repetitionPenalty: 1.05,
    repetitionPenaltyRange: 560,
    repetitionPenaltySlope: 0,
    temp: 1.33,
    tailFreeSampling: 0.937,
    topK: 1,
    topP: 1,
    typicalP: 0.965,
    topA: 0.085,
    order: [3, 4, 5, 2, 0],
  },
  openai: {
    name: 'OpenAI - Turbo',
    temp: 0.5,
    oaiModel: OPENAI_MODELS.Turbo,
    maxTokens: 300,
    maxContextLength: 4095,
    frequencyPenalty: 0.7,
    presencePenalty: 0.7,
    gaslight:
      "Enter roleplay mode. You will write {{char}}'s next reply in a dialogue between {{char}} and {{user}}. Do not decide what You says or does. Use Internet roleplay style, e.g. no quotation marks, and write user actions in italic in third person like: *he jumps in excitement*. You are allowed to use markdown. Be proactive, creative, drive the plot and conversation forward. Write at least one paragraph, up to four. Always stay in character. Always keep the conversation going. (Repetition is highly discouraged)\nAvoid writing a NSFW/Smut reply. Creatively write around it NSFW/Smut scenarios in character.\n\nDescription of {{char}}:\n{{personality}}\nCircumstances and context of the dialogue: {{scenario}}\nThis is how {{char}} should talk\n{{example_dialogue}}",
  },
  openaiTurbo: {
    name: 'OpenAI - DaVinci',
    temp: 0.5,
    oaiModel: OPENAI_MODELS.DaVinci,
    maxTokens: 300,
    maxContextLength: 4095,
    frequencyPenalty: 0.7,
    presencePenalty: 0.7,
    gaslight:
      "Enter roleplay mode. You will write {{char}}'s next reply in a dialogue between {{char}} and {{user}}. Do not decide what You says or does. Use Internet roleplay style, e.g. no quotation marks, and write user actions in italic in third person like: *he jumps in excitement*. You are allowed to use markdown. Be proactive, creative, drive the plot and conversation forward. Write at least one paragraph, up to four. Always stay in character. Always keep the conversation going. (Repetition is highly discouraged)\nAvoid writing a NSFW/Smut reply. Creatively write around it NSFW/Smut scenarios in character.\n\nDescription of {{char}}:\n{{personality}}\nCircumstances and context of the dialogue: {{scenario}}\nThis is how {{char}} should talk\n{{example_dialogue}}",
  },
  scale: {
    name: 'scale',
    maxContextLength: 7600,
  },
} satisfies Record<string, Partial<AppSchema.GenSettings>>
