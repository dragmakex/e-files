import type { Metadata } from "next"
import type { ReactNode } from "react"
import "@/app/globals.css"

export const metadata: Metadata = {
  title: "Stickystein",
  description: "Ask questions over the Epstein PDFs with citations."
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
