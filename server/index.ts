import path from 'node:path'
import { existsSync } from 'node:fs'
import express from 'express'
import { PROJECT_ROOT } from './guard'
import { getAll, getKey, setKey } from './store'
import { hasApiKey, runClaude, type ChatEvent } from './claude'

const app = express()
app.use(express.json({ limit: '2mb' }))

// --- Configuración que el frontend consulta al arrancar ---
app.get('/api/config', (_req, res) => {
  res.json({ hasApiKey: hasApiKey() })
})

// --- Memoria estructurada (features leen/escriben aquí) ---
app.get('/api/data', async (_req, res) => {
  res.json(await getAll())
})

app.get('/api/data/:key', async (req, res) => {
  res.json({ value: await getKey(req.params.key) })
})

app.put('/api/data/:key', async (req, res) => {
  const value = req.body?.value
  await setKey(req.params.key, value)
  res.json({ ok: true })
})

// --- Chat con Claude Code (SSE en streaming) ---
app.post('/api/chat', async (req, res) => {
  const prompt: string = req.body?.prompt ?? ''
  const sessionId: string | undefined = req.body?.sessionId

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  const send = (event: ChatEvent) => res.write(`data: ${JSON.stringify(event)}\n\n`)

  if (!prompt.trim()) {
    send({ type: 'error', reason: 'empty_prompt' })
    return res.end()
  }
  if (!hasApiKey()) {
    send({ type: 'error', reason: 'no_api_key' })
    return res.end()
  }

  try {
    for await (const event of runClaude(prompt, sessionId)) {
      send(event)
    }
  } catch (err: any) {
    send({ type: 'error', reason: String(err?.message ?? err) })
  }
  res.end()
})

// --- En producción, sirve el frontend ya compilado ---
const distDir = path.join(PROJECT_ROOT, 'dist')
if (process.env.NODE_ENV === 'production' && existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

const port = Number(process.env.PORT) || 8787
app.listen(port, () => {
  console.log(`[server] escuchando en http://localhost:${port}`)
  if (!hasApiKey()) {
    console.log('[server] AVISO: sin ANTHROPIC_API_KEY. El chat mostrará un aviso de configuración.')
  }
})
