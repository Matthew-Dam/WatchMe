import api from './api'
import type { ChatMessage } from '@/types'

export async function sendChatMessage(
  titleId: string,
  token: string,
  profileId: string,
  content: string,
  timestampSeconds = 0,
): Promise<ChatMessage> {
  const { data } = await api.post(`/titles/${titleId}/chat/send`, null, {
    params: {
      token,
      profile_id: profileId,
      content,
      timestamp_seconds: timestampSeconds,
    },
  })
  return data
}
