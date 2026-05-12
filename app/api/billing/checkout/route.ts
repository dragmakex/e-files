import { env } from "@/lib/env"
import { toAppError } from "@/lib/errors"
import { errorResponse, ok, requestIdFromRequest } from "@/lib/http"
import { stripe } from "@/lib/stripe"
import { requireCurrentUser } from "@/server/auth"

export const POST = async (request: Request) => {
  const requestId = requestIdFromRequest(request)

  try {
    const user = await requireCurrentUser()
    const checkout = await stripe().checkout.sessions.create({
      mode: "payment",
      success_url: `${env.appBaseUrl}/chat?billing=success`,
      cancel_url: `${env.appBaseUrl}/chat?billing=cancel`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        queriesPerPack: String(env.stripe.queriesPerPack)
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: env.stripe.priceCents,
            product_data: {
              name: `${env.stripe.queriesPerPack} query pack`,
              description: `$${(env.stripe.priceCents / 100).toFixed(2)} for ${env.stripe.queriesPerPack} queries`
            }
          }
        }
      ]
    })

    return ok({ url: checkout.url }, requestId)
  } catch (error) {
    return errorResponse(toAppError(error), requestId)
  }
}
