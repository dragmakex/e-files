import Stripe from "stripe"

import { ExternalServiceError } from "@/lib/errors"
import { env } from "@/lib/env"

let stripeClient: Stripe | null = null

export const stripe = (): Stripe => {
  if (!env.stripe.secretKey) {
    throw new ExternalServiceError("Stripe is not configured")
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.stripe.secretKey)
  }

  return stripeClient
}
