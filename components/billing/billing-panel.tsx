"use client"

import { useEffect, useState } from "react"

import { QueryPackButton } from "@/components/billing/query-pack-button"
import { authClient } from "@/lib/auth"

type BillingStatus = {
  email?: string
  name?: string
  queryCredits: number
  priceCents: number
  queriesPerPack: number
}

export function BillingPanel({ compact = false }: { compact?: boolean }) {
  const { data: authSession, isPending: authPending } = authClient.useSession()
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = async () => {
    try {
      const response = await fetch("/api/billing/status", { cache: "no-store" })
      const body = await response.json()
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not load billing status")
      setStatus(body)
      setError(null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load billing status")
    }
  }

  useEffect(() => {
    if (!authSession?.user) {
      setStatus(null)
      setError(null)
      return
    }

    void loadStatus()
  }, [authSession?.user?.id])

  const priceLabel =
    status ? `$${(status.priceCents / 100).toFixed(2)} for ${status.queriesPerPack} queries` : "$1.00 for 5 queries"

  return (
    <section className={`window billing-panel ${compact ? "billing-panel-compact" : ""}`.trim()}>
      <div className="window-title">Query Pack</div>
      <div className="billing-panel-body">
        <p className="billing-meta">
          {authPending ? "Checking account..." : !authSession?.user ? "Sign in to buy queries." : status ? `${status.queryCredits} queries remaining` : "Loading queries..."}
        </p>
        {authSession?.user ? <p className="billing-meta">{status?.name || authSession.user.name || authSession.user.email}</p> : null}
        <p className="billing-meta">{priceLabel}</p>
        {error ? <p className="billing-error">{error}</p> : null}
        <QueryPackButton
          label={`Buy ${priceLabel}`}
          onPurchased={() => void loadStatus()}
          disabled={!authSession?.user}
          onError={(message) => setError(message)}
        />
      </div>
    </section>
  )
}
