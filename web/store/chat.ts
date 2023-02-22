import { AppSchema } from '../../srv/db/schema'
import { api } from './api'
import { createStore } from './create'
import { toastStore } from './toasts'

type ChatState = {
  lastChatId: string | null
  activeChat?: {
    chat: AppSchema.Chat
    character: AppSchema.Character
  }
  responding: boolean
  msgs: AppSchema.ChatMessage[]
  chats?: {
    loaded: boolean
    character: AppSchema.Character
    list: AppSchema.Chat[]
  }
  partial?: string
}

export type NewChat = {
  name: string
  greeting: string
  scenario: string
  sampleChat: string
}

export const chatStore = createStore<ChatState>('chat', {
  responding: false,
  lastChatId: localStorage.getItem('lastChatId'),
  msgs: [],
})((get, set) => {
  return {
    async getChat(_, id: string) {
      const res = await api.get<{
        chat: AppSchema.Chat
        messages: AppSchema.ChatMessage[]
        character: AppSchema.Character
      }>(`/chat/${id}`)
      if (res.error) toastStore.error(`Failed to retrieve conversation: ${res.error}`)
      if (res.result) {
        localStorage.setItem('lastChatId', id)
        return {
          lastChatId: id,
          activeChat: {
            chat: res.result.chat,
            character: res.result.character,
          },
          msgs: res.result.messages,
        }
      }
    },
    getChats: async (_, characterId: string) => {
      const res = await api.get<{ character: AppSchema.Character; chats: AppSchema.Chat[] }>(
        `/chat/${characterId}/chats`
      )
      if (res.error) toastStore.error('Failed to retrieve conversations')
      if (res.result) {
        return {
          chats: {
            loaded: true,
            character: res.result.character,
            list: res.result.chats,
          },
        }
      }
    },
    async *createChat(
      state,
      characterId: string,
      props: NewChat,
      onSuccess?: (id: string) => void
    ) {
      const res = await api.post<AppSchema.Chat>('/chat', { characterId, ...props })
      if (res.error) toastStore.error(`Failed to create conversation`)
      if (res.result) {
        const character = state.chats?.character!
        yield {
          activeChat: { character, chat: res.result },
        }

        onSuccess?.(res.result._id)
      }
    },

    async *retry({ activeChat, msgs }) {
      if (msgs.length < 3) {
        toastStore.error(`Cannot retry: Not enough messages`)
        return
      }

      const [message, _] = msgs.slice(-2)
      yield { msgs: msgs.slice(0, -2) }
      chatStore.send(message.msg)
    },
    async *send({ activeChat, msgs }, message: string) {
      const chatId = activeChat?.chat._id
      yield { partial: '' }
      if (!chatId) {
        toastStore.error('Could not send message: No active chat')
        yield { partial: undefined }
        return
      }

      let current = ''
      yield { responding: true }
      const stream = await api.streamPost<string | AppSchema.ChatMessage>(
        `/chat/${chatId}/message`,
        { message, history: msgs.slice(-10) }
      )

      for await (const message of stream) {
        if (typeof message === 'string') {
          current += message
          yield { partial: current }
        } else {
          const { msgs } = get()
          yield { msgs: [...msgs, message] }
        }
      }
      yield { responding: false, partial: undefined }
    },
    async deleteChats(_, ids: AppSchema.ChatMessage[]) {},
  }
})