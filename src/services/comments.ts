import api from './api'
import type { Comment, PaginatedResponse } from '@/types'

export async function getComments(
  titleId: string,
  params?: { page?: number; page_size?: number },
): Promise<PaginatedResponse<Comment>> {
  const response = await api.get<PaginatedResponse<Comment>>(
    `/comments/${titleId}`,
    { params },
  )
  return response.data
}

export async function getSpoilerFreeComments(
  titleId: string,
  params?: { page?: number; page_size?: number },
): Promise<PaginatedResponse<Comment>> {
  const response = await api.get<PaginatedResponse<Comment>>(
    `/comments/${titleId}/spoiler-free`,
    { params },
  )
  return response.data
}

export async function createComment(
  titleId: string,
  data: { content: string; parent_id?: string; is_spoiler?: boolean; video_timestamp?: number | null; profile_id: string },
): Promise<Comment> {
  const response = await api.post<Comment>(`/comments/${titleId}`, {
    text: data.content,
    parent_id: data.parent_id,
    spoiler_tag: data.is_spoiler ?? false,
    timestamp_seconds: data.video_timestamp,
  }, { params: { profile_id: data.profile_id } })
  return response.data
}

export async function updateComment(
  commentId: string,
  data: { content?: string; is_spoiler?: boolean },
): Promise<Comment> {
  const response = await api.put<Comment>(`/comments/${commentId}`, {
    text: data.content,
    spoiler_tag: data.is_spoiler,
  })
  return response.data
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${commentId}`)
}

export async function likeComment(commentId: string): Promise<{ liked: boolean; likes_count: number }> {
  const response = await api.post<{ liked: boolean; likes_count: number }>(
    `/comments/${commentId}/like`,
  )
  return response.data
}
