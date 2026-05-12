"use client"

import { useState } from "react"

import { PrimaryButton } from "@/components/ui/button"

export function QueryPackButton({
  label,
  className = "",
  onPurchased,
  disabled = false,
  onError
}: {
  label: string
  className?: string
  onPurchased?: () => void
  disabled?: boolean
  onError?: (message: string) => void
}) {
  const [pending, setPending] = useState(false)

  return (
    <PrimaryButton
      className={className}
      disabled={pending || disabled}
      onClick={async () => {
        setPending(true)
        try {
          const response = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({})
          })
          const body = await response.json()
          if (!response.ok || !body?.url) {
            throw new Error(body?.error?.message ?? "Could not start checkout")
          }
          onPurchased?.()
          window.location.href = body.url
        } catch (checkoutError) {
          onError?.(checkoutError instanceof Error ? checkoutError.message : "Could not start checkout")
        } finally {
          setPending(false)
        }
      }}
      type="button"
    >
      {pending ? "Opening Stripe..." : label}
    </PrimaryButton>
  )
}
