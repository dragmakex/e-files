"use client"

import { FormEvent, useState } from "react"

import { authClient } from "@/lib/auth"
import { PrimaryButton, SecondaryButton } from "@/components/ui/button"

export function AuthPanel({ compact = false }: { compact?: boolean }) {
  const { data: authSession, isPending, refetch } = authClient.useSession()
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState<"twitter" | "email" | "signout" | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSignedIn = Boolean(authSession?.user)

  const onMagicLink = async (event: FormEvent) => {
    event.preventDefault()
    if (!email.trim()) return

    setPending("email")
    setMessage(null)
    setError(null)

    try {
      const result = await authClient.signIn.magicLink({
        email: email.trim(),
        callbackURL: "/chat",
        newUserCallbackURL: "/chat"
      })

      if (result.error) {
        throw new Error(result.error.message ?? "Could not send magic link")
      }

      setMessage("Check your email for the sign-in link.")
    } catch (magicLinkError) {
      setError(magicLinkError instanceof Error ? magicLinkError.message : "Could not send magic link")
    } finally {
      setPending(null)
    }
  }

  return (
    <section className={`window auth-panel ${compact ? "auth-panel-compact" : ""}`.trim()}>
      <div className="window-title">Sign In</div>
      <div className="auth-panel-body">
        {isPending ? <p className="billing-meta">Checking account...</p> : null}
        {isSignedIn ? (
          <>
            <p className="billing-meta">
              Signed in as {authSession?.user.name || authSession?.user.email}
            </p>
            <SecondaryButton
              disabled={pending !== null}
              onClick={async () => {
                setPending("signout")
                setMessage(null)
                setError(null)
                try {
                  await authClient.signOut()
                  await refetch()
                } catch (signOutError) {
                  setError(signOutError instanceof Error ? signOutError.message : "Could not sign out")
                } finally {
                  setPending(null)
                }
              }}
              type="button"
            >
              {pending === "signout" ? "Signing out..." : "Sign out"}
            </SecondaryButton>
          </>
        ) : (
          <>
            <p className="billing-meta">Use X or a magic link. Queries are tied to your account.</p>
            <PrimaryButton
              disabled={pending !== null}
              onClick={async () => {
                setPending("twitter")
                setMessage(null)
                setError(null)
                try {
                  await authClient.signIn.social({
                    provider: "twitter",
                    callbackURL: "/chat"
                  })
                } catch (twitterError) {
                  setPending(null)
                  setError(twitterError instanceof Error ? twitterError.message : "Could not start X sign-in")
                }
              }}
              type="button"
            >
              {pending === "twitter" ? "Opening X..." : "Continue with X"}
            </PrimaryButton>
            <form className="auth-email-form" onSubmit={(event) => void onMagicLink(event)}>
              <label htmlFor="auth-email-input" className="sr-only">
                Email address
              </label>
              <input
                id="auth-email-input"
                type="email"
                className="input98 auth-email-input"
                autoComplete="email"
                placeholder="Email for magic link"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={pending !== null}
              />
              <SecondaryButton disabled={pending !== null} type="submit">
                {pending === "email" ? "Sending..." : "Send magic link"}
              </SecondaryButton>
            </form>
          </>
        )}
        {message ? <p className="billing-meta">{message}</p> : null}
        {error ? <p className="billing-error">{error}</p> : null}
      </div>
    </section>
  )
}
