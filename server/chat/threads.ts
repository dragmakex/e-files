import { ForbiddenError } from "@/lib/errors"
import { createThread, getThreadUserId } from "@/server/repositories/chat-repo"

export const createThreadForUser = async (userId: string, title?: string) => {
  return createThread(userId, title?.trim() || "New Thread")
}

export const assertThreadOwnership = async (threadId: string, userId: string): Promise<void> => {
  const ownerUserId = await getThreadUserId(threadId)
  if (!ownerUserId || ownerUserId !== userId) {
    throw new ForbiddenError("Thread does not belong to this user")
  }
}
