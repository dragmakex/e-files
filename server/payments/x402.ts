import { env } from "@/lib/env"
import { ExternalServiceError, PaymentRequiredError, ValidationError } from "@/lib/errors"

const PAYMENT_SIGNATURE_HEADER = "PAYMENT-SIGNATURE"
const PAYMENT_RESPONSE_HEADER = "PAYMENT-RESPONSE"

type X402PaymentRequirement = {
  readonly scheme: "exact"
  readonly network: string
  readonly maxAmountRequired: string
  readonly resource: string
  readonly description: string
  readonly mimeType: string
  readonly payTo: string
  readonly maxTimeoutSeconds: number
  readonly asset: string
  readonly extra: {
    readonly name: string
    readonly version: string
  }
}

type X402AcceptedPayment = {
  readonly scheme: string
  readonly network: string
  readonly maxAmountRequired: string
  readonly resource: string
  readonly payTo: string
  readonly asset: string
}

type X402PaymentPayload = {
  readonly x402Version: number
  readonly scheme: string
  readonly network: string
  readonly payload: unknown
  readonly signature: string
  readonly authorization?: unknown
  readonly accepted: X402AcceptedPayment
}

type X402PaymentRequired = {
  readonly x402Version: 2
  readonly accepts: readonly [X402PaymentRequirement]
  readonly error?: string
}

type X402VerifyResponse = {
  readonly isValid: boolean
  readonly invalidReason?: string
  readonly payer?: string
}

type X402SettleResponse = {
  readonly success: boolean
  readonly errorReason?: string
  readonly transaction: string
  readonly network: string
  readonly payer: string
}

export type PendingX402Payment = {
  readonly settle: () => Promise<{ paymentResponseHeader: string }>
}

const encodeHeaderJson = (payload: unknown): string => Buffer.from(JSON.stringify(payload), "utf8").toString("base64")

const decodeHeaderJson = <T>(value: string, headerName: string): T => {
  let jsonText = ""
  try {
    jsonText = Buffer.from(value, "base64").toString("utf8")
  } catch {
    throw new ValidationError(`${headerName} must be valid base64`)
  }

  try {
    return JSON.parse(jsonText) as T
  } catch {
    throw new ValidationError(`${headerName} must contain valid JSON`)
  }
}

const toBaseUrl = (url: string): string => url.replace(/\/+$/, "")

const createRequirement = (request: Request): X402PaymentRequirement => ({
  scheme: "exact",
  network: env.x402.network,
  maxAmountRequired: env.x402.amount,
  resource: request.url,
  description: env.x402.resourceDescription,
  mimeType: env.x402.resourceMimeType,
  payTo: env.x402.payTo,
  maxTimeoutSeconds: env.x402.maxTimeoutSeconds,
  asset: env.x402.asset,
  extra: {
    name: env.x402.assetName,
    version: env.x402.assetVersion
  }
})

const createChallenge = (requirement: X402PaymentRequirement, error?: string): string =>
  encodeHeaderJson({
    x402Version: 2,
    accepts: [requirement],
    ...(error ? { error } : {})
  } satisfies X402PaymentRequired)

const createSettlementHeader = (payload: X402SettleResponse): string =>
  encodeHeaderJson({
    x402Version: 2,
    ...payload
  })

const ensureAcceptedTerms = (accepted: X402AcceptedPayment, expected: X402PaymentRequirement, challengeHeader: string): void => {
  const termsMatch =
    accepted.scheme === expected.scheme &&
    accepted.network === expected.network &&
    accepted.maxAmountRequired === expected.maxAmountRequired &&
    accepted.resource === expected.resource &&
    accepted.payTo === expected.payTo &&
    accepted.asset === expected.asset
  if (!termsMatch) {
    throw new PaymentRequiredError("Payment terms mismatch", challengeHeader)
  }
}

const callFacilitator = async <T>(path: "/verify" | "/settle", payload: unknown): Promise<T> => {
  const endpoint = `${toBaseUrl(env.x402.facilitatorUrl)}${path}`
  let response: Response
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    })
  } catch (error) {
    throw new ExternalServiceError(`x402 facilitator request failed (${path})`, error)
  }

  if (!response.ok) {
    throw new ExternalServiceError(`x402 facilitator returned ${response.status} (${path})`)
  }

  try {
    return (await response.json()) as T
  } catch (error) {
    throw new ExternalServiceError(`x402 facilitator returned invalid JSON (${path})`, error)
  }
}

export const requireX402Payment = async (request: Request): Promise<PendingX402Payment | null> => {
  if (!env.x402.enabled) return null

  const requirement = createRequirement(request)
  const challengeHeader = createChallenge(requirement)
  const paymentSignature = request.headers.get(PAYMENT_SIGNATURE_HEADER)
  if (!paymentSignature) {
    throw new PaymentRequiredError("Payment required", challengeHeader)
  }

  const paymentPayload = decodeHeaderJson<X402PaymentPayload>(paymentSignature, PAYMENT_SIGNATURE_HEADER)
  ensureAcceptedTerms(paymentPayload.accepted, requirement, challengeHeader)

  const verifyResult = await callFacilitator<X402VerifyResponse>("/verify", {
    x402Version: 2,
    paymentPayload,
    paymentRequirements: [requirement]
  })

  if (!verifyResult.isValid) {
    throw new PaymentRequiredError(
      "Payment verification failed",
      createChallenge(requirement, verifyResult.invalidReason ?? "invalid_payment"),
      createSettlementHeader({
        success: false,
        transaction: "",
        network: requirement.network,
        payer: verifyResult.payer ?? "",
        errorReason: verifyResult.invalidReason ?? "invalid_payment"
      })
    )
  }

  return {
    settle: async () => {
      const settleResult = await callFacilitator<X402SettleResponse>("/settle", {
        x402Version: 2,
        paymentPayload,
        paymentRequirements: [requirement]
      })
      const paymentResponseHeader = createSettlementHeader(settleResult)

      if (!settleResult.success) {
        throw new PaymentRequiredError(
          "Payment settlement failed",
          createChallenge(requirement, settleResult.errorReason ?? "payment_settlement_failed"),
          paymentResponseHeader
        )
      }

      return { paymentResponseHeader }
    }
  }
}

export const paymentResponseHeaderName = PAYMENT_RESPONSE_HEADER
