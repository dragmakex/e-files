"use client"

import { useEffect, useMemo, useState } from "react"

import { SecondaryButton } from "@/components/ui/button"

type DocumentRow = {
  documentId: string
  filename: string
  status: string
}

type DocumentsResponse = {
  documents?: ReadonlyArray<DocumentRow>
  pagination?: {
    totalCount?: number
    totalPages?: number
  }
}

const PAGE_SIZE = 25

export function CorpusListPanel() {
  const [documents, setDocuments] = useState<ReadonlyArray<DocumentRow>>([])
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    void (async () => {
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
        const response = await fetch(`/api/index/documents?${params.toString()}`, { cache: "no-store", signal: controller.signal })
        const body = (await response.json()) as DocumentsResponse & { error?: { message?: string } }
        if (!response.ok) {
          throw new Error(body?.error?.message ?? "Could not load indexed PDFs")
        }
        setDocuments(body.documents ?? [])
        setTotalCount(body.pagination?.totalCount ?? 0)
        setTotalPages(body.pagination?.totalPages ?? 1)
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return
        setError(err instanceof Error ? err.message : "Could not load indexed PDFs")
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    })()

    return () => controller.abort()
  }, [page])

  const pagedDocuments = useMemo(() => documents, [documents])

  return (
    <section className="window corpus-card">
      <div className="window-title">Indexed PDFs</div>
      <div className="corpus-panel">
        <div className="corpus-panel-header">
          <p className="corpus-meta">{loading ? "Loading..." : `${totalCount} indexed PDFs`}</p>
          <p className="corpus-meta">Page {page} of {totalPages}</p>
        </div>
        {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}
        <div className="table-scroll">
          <table className="status-table">
            <thead>
              <tr>
                <th align="left">File</th>
                <th className="status-table-availability">Available</th>
              </tr>
            </thead>
            <tbody>
              {pagedDocuments.map((document) => (
                <tr key={document.documentId}>
                  <td>{document.filename}</td>
                  <td className="status-table-availability">{document.status === "ready" ? "✓" : ""}</td>
                </tr>
              ))}
              {!loading && pagedDocuments.length === 0 ? (
                <tr>
                  <td colSpan={2}>No indexed PDFs found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="corpus-pagination">
          <SecondaryButton onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
            Previous
          </SecondaryButton>
          <SecondaryButton onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
            Next
          </SecondaryButton>
        </div>
      </div>
    </section>
  )
}
