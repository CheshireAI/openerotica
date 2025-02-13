import { v4 } from 'uuid'
import { storage } from '/web/shared/util'
import { localApi } from './storage'
import { now } from '/common/util'
import { ModelFormat } from '/common/presets/templates'

const KEYS = {
  templates: 'agnai-guided-templates',
  sessions: 'agnai-guided-sessions',
}

export type FieldKind = 'string' | 'number' | 'boolean'
export type FieldType = string | number | boolean

export type SagaField = {
  name: string
  label: string
  visible: boolean
  type: FieldKind
  list?: string
}

export type SagaTemplate = {
  _id: string
  name: string
  byline: string
  description: string

  display: string
  introduction: string
  init: string
  loop: string
  history: string
  imagePrompt: string
  imagesEnabled: boolean

  fields: Array<SagaField>

  /**
   * Placeholders (E.g. {{first_name}}) that are referenced, but not generated by a template.
   * These must be manually filled out by the user. The value is stored in `session.overrides`
   */
  manual: string[]
  lists: Record<string, string[]>
}

export type SagaSession = {
  _id: string
  format: ModelFormat
  customFormat?: {
    user: string
    assistant: string
  }

  gameId: string
  presetId?: string

  /** Field value overrides */
  init?: Record<string, string>
  overrides: Record<string, string>
  responses: SagaResponse[]
  updated: string
}

export type SagaResponse = {
  input: string
  response: string
} & Record<string, FieldType>

export const sagaApi = {
  createTemplate,
  getTemplates,
  saveTemplate,
  getSessions,
  createSession,
  saveSession,
  removeSession,
  removeTemplate,
}

async function createTemplate(template: Omit<SagaTemplate, '_id'>) {
  const create: SagaTemplate = {
    ...template,
    _id: v4(),
  }

  await saveTemplate(create)

  return localApi.result(create)
}

async function getTemplates() {
  const all = (await storage.getItem(KEYS.templates)) || '[]'
  const templates = JSON.parse(all) as SagaTemplate[]
  for (const template of templates) {
    template.lists ??= {}
  }
  return localApi.result({ templates })
}

async function saveTemplate(template: SagaTemplate) {
  const create = { ...template }
  if (!create._id) {
    create._id = v4()
  }

  const { result } = await getTemplates()
  const next = result.templates.filter((t) => t._id !== template._id).concat(create)

  await storage.setItem(KEYS.templates, JSON.stringify(next))
  return localApi.result(template)
}

async function getSessions() {
  const json = (await storage.getItem(KEYS.sessions)) || '[]'
  const sessions = JSON.parse(json) as SagaSession[]

  for (const sess of sessions) {
    if (!sess._id || sess._id === 'new') {
      sess._id = v4()
    }
  }

  await storage.setItem(KEYS.sessions, JSON.stringify(sessions))

  return localApi.result({ sessions })
}

async function saveSession(session: SagaSession) {
  const update = { ...session }
  if (!update._id || update._id === 'new') {
    update._id = v4()
  }

  const sessions = await getSessions()
  const next = sessions.result.sessions.filter((s) => s._id !== session._id)
  next.push(update)
  await storage.setItem(KEYS.sessions, JSON.stringify(next))
  return localApi.result({ sessions: next, session: update })
}

async function createSession(gameId: string) {
  const session: SagaSession = {
    _id: v4(),
    format: 'Alpaca',
    gameId,
    overrides: {},
    responses: [],
    updated: now(),
  }

  const { result } = await getSessions()
  const next = result.sessions.concat(session)
  await storage.setItem(KEYS.sessions, JSON.stringify(next))
  return session
}

async function removeTemplate(id: string) {
  const { result } = await getTemplates()
  const next = result.templates.filter((s) => s._id !== id)
  await storage.setItem(KEYS.templates, JSON.stringify(next))

  return localApi.result({ templates: next })
}

async function removeSession(id: string) {
  const { result } = await getSessions()
  const next = result.sessions.filter((s) => s._id !== id)
  await storage.setItem(KEYS.sessions, JSON.stringify(next))

  return localApi.result({ sessions: next })
}
