import Stripe from "stripe"

import { env } from "@/lib/env"
import { toAppError, ValidationError } from "@/lib/errors"
import { errorResponse, ok, requestIdFromRequest } from "@/lib/http"
import { stripe } from "@/lib/stripe"
import { grantQueryCreditsFromStripeEvent } from "@/server/repositories/chat-repo"

export const POST = async (request: Request) => {
  const requestId = requestIdFromRequest(request)

  try {
    if (!env.stripe.webhookSecret) {
      throw new ValidationError("Stripe webhook is not configured")
    }

    const signature = request.headers.get("stripe-signature")
    if (!signature) {
      throw new ValidationError("Missing Stripe signature")
    }

    const rawBody = await request.text()
    const event = stripe().webhooks.constructEvent(rawBody, signature, env.stripe.webhookSecret)

    if (event.type === "checkout.session.completed") {
      const checkoutSession = event.data.object as Stripe.Checkout.Session
      const userId = checkoutSession.metadata?.userId ?? checkoutSession.client_reference_id
      if (!userId || !checkoutSession.id) {
        throw new ValidationError("Stripe checkout session missing user metadata")
      }

      await grantQueryCreditsFromStripeEvent({
        stripeEventId: event.id,
        stripeCheckoutSessionId: checkoutSession.id,
        userId,
        credits: env.stripe.queriesPerPack,
        amountCents: env.stripe.priceCents,
        stripeCustomerId: typeof checkoutSession.customer === "string" ? checkoutSession.customer : null
      })
    }

    return ok({ received: true }, requestId)
  } catch (error) {
    return errorResponse(toAppError(error), requestId)
  }
}
