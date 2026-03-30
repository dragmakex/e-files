"use client"

import { previewText } from "@/lib/utils/text"

export type CitationView = {
  documentId: string
  filename: string
  pageNumber: number | null
  chunkId: string
  snippet: string
}

export function CitationItem({ citation }: { citation: CitationView }) {
  const { preview } = previewText(citation.snippet, 220)

  return (
    <li className="window citation-card">
      <strong className="citation-filename">{citation.filename}</strong> (page {citation.pageNumber ?? "n/a"})
      <div className="citation-snippet">{preview}</div>
    </li>
  )
}
