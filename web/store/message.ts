import { AppSchema } from '../../srv/db/schema'
import { api } from './api'
import { createStore } from './create'
import { subscribe } from './socket'
import { toastStore } from './toasts'

type MsgStore = {
  activeChatId: string
  msgs: AppSchema.ChatMessage[]
  partial?: string
  retrying?: AppSchema.ChatMessage
  waiting?: string
}

export const msgStore = createStore<MsgStore>('messages', {
  activeChatId: '',
  msgs: [],
})((get) => {
  return {
    async editMessage({ msgs }, msgId: string, msg: string) {
      const res = await api.method('put', `/chat/${msgId}/message`, { message: msg })
      if (res.error) {
        toastStore.error(`Failed to update message: ${res.error}`)
      }
      if (res.result) {
        return { msgs: msgs.map((m) => (m._id === msgId ? { ...m, msg } : m)) }
      }
    },

    async *retry({ msgs }, chatId: string) {
      if (msgs.length < 3) {
        toastStore.error(`Cannot retry: Not enough messages`)
        return
      }

      if (!chatId) {
        toastStore.error('Could not send message: No active chat')
        yield { partial: undefined }
        return
      }

      yield { partial: '', waiting: chatId }

      const [message, replace] = msgs.slice(-2)
      yield { msgs: msgs.slice(0, -1), retrying: replace, partial: '' }

      await api.post<string | AppSchema.ChatMessage>(`/chat/${chatId}/retry/${replace._id}`, {
        message: message.msg,
        history: msgs.slice(-22, -2),
      })
    },
    async resend({ msgs }, chatId: string, msgId: string) {
      const msgIndex = msgs.findIndex((m) => m._id === msgId)
      const msg = msgs[msgIndex]

      if (msgIndex === -1) {
        return toastStore.error('Cannot resend message: Message not found')
      }

      msgStore.send(chatId, msg.msg, true)
    },
    async *send({ msgs }, chatId: string, message: string, retry?: boolean) {
      if (!chatId) {
        toastStore.error('Could not send message: No active chat')
        yield { partial: undefined }
        return
      }

      yield { partial: '', waiting: chatId }

      await api.post<string | AppSchema.ChatMessage>(`/chat/${chatId}/message`, {
        message,
        history: msgs.slice(-20),
        retry,
      })
    },
    async deleteMessages({ msgs }, fromId: string) {
      const index = msgs.findIndex((m) => m._id === fromId)
      if (index === -1) {
        return toastStore.error(`Cannot delete message: Message not found`)
      }

      const deleteIds = msgs.slice(index).map((m) => m._id)
      const res = await api.method('delete', `/chat/messages`, { ids: deleteIds })

      if (res.error) {
        return toastStore.error(`Failed to delete messages: ${res.error}`)
      }
      return { msgs: msgs.slice(0, index) }
    },
  }
})

subscribe('message-partial', { partial: 'string', chatId: 'string' }, (body) => {
  const { activeChatId } = msgStore.getState()
  if (body.chatId !== activeChatId) return

  msgStore.setState({ partial: body.partial })
})

subscribe('message-retry', { messageId: 'string', chatId: 'string', message: 'string' }, (body) => {
  const { retrying, msgs, activeChatId } = msgStore.getState()
  if (!retrying) return
  if (activeChatId !== body.chatId) return

  msgStore.setState({
    partial: undefined,
    retrying: undefined,
    waiting: undefined,
    msgs: msgs
      .filter((msg) => msg._id !== body.messageId)
      .concat({ ...retrying, msg: body.message }),
  })
})

subscribe('message-created', { msg: 'any', chatId: 'string' }, (body) => {
  const { msgs, activeChatId } = msgStore.getState()
  if (activeChatId !== body.chatId) return

  // If the message is from a user don't clear the "waiting for response" flags
  if (body.msg.userId) {
    msgStore.setState({ msgs: msgs.concat(body.msg) })
  } else {
    msgStore.setState({ msgs: msgs.concat(body.msg), partial: undefined, waiting: undefined })
  }
})

subscribe('message-error', { error: 'any', chatId: 'string', messageId: 'string' }, (body) => {
  toastStore.error(`Failed to generate response: ${body.error}`)
  msgStore.setState({ partial: undefined, waiting: undefined })
})