import { SecondaryButtonLink } from "@/components/ui/button"
import { ChatShell } from "@/components/chat/chat-shell"

export default function ChatPage() {
  return (
    <main className="container" style={{ display: "grid", gap: 12 }}>
      <div>
        <SecondaryButtonLink href="/">Back</SecondaryButtonLink>
      </div>
      <ChatShell />
    </main>
  )
}
