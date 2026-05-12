import { withDb } from "@/db/client"
import { makeId } from "@/lib/ids"

export type ChatMessageRow = {
  readonly id: string
  readonly role: "user" | "assistant" | "system"
  readonly content: string
  readonly citations: unknown
  readonly retrievalMeta: unknown
  readonly createdAt: string
}

export type BillingStatusRow = {
  readonly queryCredits: number
}

export const getUserBillingStatus = async (userId: string): Promise<BillingStatusRow> => {
  return withDb(async (sql) => {
    const [row] = await sql<BillingStatusRow[]>`
      SELECT query_credits as "queryCredits"
      FROM users
      WHERE id = ${userId}
      LIMIT 1
    `
    return row ?? { queryCredits: 0 }
  })
}

export const consumeQueryCredit = async (userId: string): Promise<number | null> => {
  return withDb(async (sql) => {
    const [row] = await sql<{ queryCredits: number }[]>`
      UPDATE users
      SET query_credits = query_credits - 1,
          "updatedAt" = now()
      WHERE id = ${userId}
        AND query_credits > 0
      RETURNING query_credits as "queryCredits"
    `
    return row?.queryCredits ?? null
  })
}

export const grantQueryCreditsFromStripeEvent = async (input: {
  stripeEventId: string
  stripeCheckoutSessionId: string
  userId: string
  credits: number
  amountCents: number
  stripeCustomerId?: string | null
}): Promise<boolean> => {
  return withDb(async (sql) =>
    sql.begin(async (tx) => {
      const trx = tx as unknown as typeof sql

      const [eventRow] = await trx<{ id: string }[]>`
        INSERT INTO billing_events (id, stripe_event_id, stripe_checkout_session_id, user_id, credits, amount_cents)
        VALUES (${makeId("bill")}, ${input.stripeEventId}, ${input.stripeCheckoutSessionId}, ${input.userId}, ${input.credits}, ${input.amountCents})
        ON CONFLICT (stripe_event_id) DO NOTHING
        RETURNING id
      `

      if (!eventRow) return false

      await trx`
        UPDATE users
        SET query_credits = query_credits + ${input.credits},
            stripe_customer_id = COALESCE(${input.stripeCustomerId ?? null}, stripe_customer_id),
            "updatedAt" = now()
        WHERE id = ${input.userId}
      `

      return true
    })
  )
}

export const createThread = async (userId: string, title: string): Promise<{ id: string; title: string; createdAt: string }> => {
  return withDb(async (sql) => {
    const [row] = await sql<{ id: string; title: string; createdAt: string }[]>`
      INSERT INTO chat_threads (id, user_id, title)
      VALUES (${makeId("thr")}, ${userId}, ${title})
      RETURNING id, title, created_at as "createdAt"
    `
    return row
  })
}

export const getThreadUserId = async (threadId: string): Promise<string | null> => {
  return withDb(async (sql) => {
    const [row] = await sql<{ userId: string }[]>`
      SELECT user_id as "userId" FROM chat_threads WHERE id = ${threadId}
    `
    return row?.userId ?? null
  })
}

export const insertMessage = async (input: {
  threadId: string
  role: "user" | "assistant" | "system"
  content: string
  citations?: unknown
  retrievalMeta?: unknown
}): Promise<{ id: string; createdAt: string }> => {
  return withDb(async (sql) => {
    const [row] = await sql<{ id: string; createdAt: string }[]>`
      INSERT INTO chat_messages (id, thread_id, role, content, citations, retrieval_meta)
      VALUES (${makeId("msg")}, ${input.threadId}, ${input.role}, ${input.content}, ${input.citations ? sql.json(input.citations as never) : null}, ${input.retrievalMeta ? sql.json(input.retrievalMeta as never) : null})
      RETURNING id, created_at as "createdAt"
    `
    return row
  })
}

export const listMessages = async (threadId: string, limit: number): Promise<ReadonlyArray<ChatMessageRow>> => {
  return listMessagesAfterCursor(threadId, limit)
}

export const listMessagesAfterCursor = async (
  threadId: string,
  limit: number,
  cursor?: { createdAt: string; id: string }
): Promise<ReadonlyArray<ChatMessageRow>> => {
  return withDb(async (sql) => {
    if (cursor) {
      return sql<ChatMessageRow[]>`
        SELECT id, role, content, citations, retrieval_meta as "retrievalMeta", created_at as "createdAt"
        FROM chat_messages
        WHERE thread_id = ${threadId}
          AND (created_at, id) > (${cursor.createdAt}::timestamptz, ${cursor.id})
        ORDER BY created_at ASC, id ASC
        LIMIT ${limit}
      `
    }

    return sql<ChatMessageRow[]>`
      SELECT id, role, content, citations, retrieval_meta as "retrievalMeta", created_at as "createdAt"
      FROM chat_messages
      WHERE thread_id = ${threadId}
      ORDER BY created_at ASC, id ASC
      LIMIT ${limit}
    `
  })
}
