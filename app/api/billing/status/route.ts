import { toAppError } from "@/lib/errors"
import { errorResponse, ok, requestIdFromRequest } from "@/lib/http"
import { env } from "@/lib/env"
import { requireCurrentUser } from "@/server/auth"
import { getUserBillingStatus } from "@/server/repositories/chat-repo"

export const GET = async (request: Request) => {
  const requestId = requestIdFromRequest(request)

  try {
    const user = await requireCurrentUser()
    const billing = await getUserBillingStatus(user.id)
    return ok(
      {
        email: user.email,
        name: user.name,
        queryCredits: billing.queryCredits,
        priceCents: env.stripe.priceCents,
        queriesPerPack: env.stripe.queriesPerPack
      },
      requestId
    )
  } catch (error) {
    return errorResponse(toAppError(error), requestId)
  }
}
