import { describe, expect, test } from "bun:test"

import { compactWhitespace, previewText, stripThinkBlocks, truncate } from "@/lib/utils/text"

describe("text utilities", () => {
  test("compactWhitespace normalizes spaces and newlines", () => {
    expect(compactWhitespace("  alpha \n  beta\tgamma  ")).toBe("alpha beta gamma")
  })

  test("truncate preserves short strings and truncates long strings", () => {
    expect(truncate("hello", 10)).toBe("hello")
    expect(truncate("hello world", 5)).toBe("hello...")
  })

  test("previewText reports truncation status", () => {
    expect(previewText("short text", 50)).toEqual({ preview: "short text", truncated: false })
    expect(previewText("0123456789", 4)).toEqual({ preview: "0123...", truncated: true })
  })

  test("stripThinkBlocks removes reasoning blocks and trims output", () => {
    expect(stripThinkBlocks("<think>\ninternal\n</think>\n\nHello!")).toBe("Hello!")
    expect(stripThinkBlocks("Hello!\n<think>hidden</think>\nWorld")).toBe("Hello!\n\nWorld")
  })
})
