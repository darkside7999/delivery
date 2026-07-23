import { useEffect, useRef, useState } from 'react'

type Role = 'user' | 'assistant' | 'notice'
interface Message {
  role: Role
  text: string
}

interface ServerEvent {
  type: 'text' | 'tool' | 'done' | 'error'
  text?: string
  tool?: string
  sessionId?: string
  reason?: string
}

const NO_KEY_MSG =
  'El chat necesita una clave de API de Anthropic para funcionar. Añade ANTHROPIC_API_KEY ' +
  'en un fichero .env (mira .env.example) y reinicia el servidor. Mientras tanto, el ' +
  'dashboard y la memoria funcionan con normalidad.'

function friendlyError(reason?: string): string {
  if (reason === 'no_api_key') return NO_KEY_MSG
  if (reason === 'empty_prompt') return 'Escribe algo primero.'
  return `Ha ocurrido un problema: ${reason ?? 'desconocido'}.`
}

export default function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text:
        '¡Hola! Soy Claude y vivo dentro de esta página. Dime qué quieres y la iré ' +
        'construyendo. Por ejemplo: «créame un calendario» o «añade una lista de tareas».',
    },
  ])
  const [tool, setTool] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const sessionRef = useRef<string | undefined>(undefined)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, tool, open])

  async function send() {
    const prompt = input.trim()
    if (!prompt || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: prompt }])
    setBusy(true)
    setTool(null)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, sessionId: sessionRef.current }),
      })
      if (!res.body) throw new Error('sin respuesta del servidor')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let assistantIndex = -1

      const appendAssistant = (chunk: string) => {
        setMessages((m) => {
          const copy = [...m]
          if (assistantIndex === -1) {
            assistantIndex = copy.length
            copy.push({ role: 'assistant', text: chunk })
          } else {
            copy[assistantIndex] = {
              role: 'assistant',
              text: copy[assistantIndex].text + chunk,
            }
          }
          return copy
        })
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data:')) continue
          const event: ServerEvent = JSON.parse(line.slice(5).trim())
          if (event.type === 'text' && event.text) {
            setTool(null)
            appendAssistant(event.text)
          } else if (event.type === 'tool') {
            setTool(event.tool ?? null)
          } else if (event.type === 'done') {
            if (event.sessionId) sessionRef.current = event.sessionId
          } else if (event.type === 'error') {
            if (event.sessionId) sessionRef.current = event.sessionId
            setMessages((m) => [...m, { role: 'notice', text: friendlyError(event.reason) }])
          }
        }
      }
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: 'notice', text: `No pude contactar con el servidor: ${err?.message ?? err}` },
      ])
    } finally {
      setBusy(false)
      setTool(null)
    }
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Abrir chat">
        💬 Chat
      </button>

      {open && (
        <div
          className="chat-overlay"
          onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <div className="chat-panel" role="dialog" aria-label="Chat con Claude">
            <div className="chat-head">
              <h2>Claude · construye la página</h2>
              <button className="chat-close" onClick={() => setOpen(false)} aria-label="Cerrar">
                ×
              </button>
            </div>

            <div className="chat-log" ref={logRef}>
              {messages.map((m, i) => (
                <div key={i} className={`msg ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {tool && <div className="msg-tool">· usando {tool}…</div>}
              {busy && !tool && <div className="msg-tool">· pensando…</div>}
            </div>

            <div className="chat-input">
              <textarea
                value={input}
                placeholder="Pide algo… (Enter para enviar)"
                rows={2}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                disabled={busy}
              />
              <button className="chat-send" onClick={send} disabled={busy || !input.trim()}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
