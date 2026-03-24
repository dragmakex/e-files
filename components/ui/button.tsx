"use client"

import type { ButtonHTMLAttributes, ReactNode } from "react"
import Link from "next/link"
import { playUiClick } from "@/lib/ui/sound"

type ButtonProps = {
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function PrimaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      onClick={(event) => {
        playUiClick()
        props.onClick?.(event)
      }}
      className={`btn btn-primary ${className}`.trim()}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({ children, className = "", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      onClick={(event) => {
        playUiClick()
        props.onClick?.(event)
      }}
      className={`btn btn-secondary ${className}`.trim()}
    >
      {children}
    </button>
  )
}

export function SecondaryButtonLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      onClick={() => playUiClick()}
      className={`btn btn-secondary ${className}`.trim()}
      style={{ display: "inline-block", textDecoration: "none" }}
    >
      {children}
    </Link>
  )
}
