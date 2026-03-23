import { env } from "@/lib/env"
import { MockLlmProvider } from "@/server/llm/providers/mock"
import { OpenAiCompatibleLlmProvider } from "@/server/llm/providers/openai-compatible"
import type { LlmProvider } from "@/server/llm/types"

export const llmProvider = (): LlmProvider => {
  if (env.llm.provider === "mock") return MockLlmProvider
  return OpenAiCompatibleLlmProvider
}
