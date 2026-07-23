import { promises as fs } from 'node:fs'
import path from 'node:path'
import { query } from '@anthropic-ai/claude-agent-sdk'
import { PROJECT_ROOT, isWritablePath } from './guard'
import { summarize } from './store'

/** Evento que enviamos al navegador por SSE. */
export interface ChatEvent {
  type: 'text' | 'tool' | 'done' | 'error'
  text?: string
  tool?: string
  sessionId?: string
  reason?: string
}

export function hasApiKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY)
}

// Herramientas de solo lectura + web: se auto-aprueban sin pasar por el guard.
const READONLY_TOOLS = ['Read', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'TodoWrite']
// Herramientas de escritura: pasan por canUseTool y se limitan a la superficie editable.
const WRITE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])

async function readFileSafe(rel: string): Promise<string> {
  try {
    return await fs.readFile(path.join(PROJECT_ROOT, rel), 'utf8')
  } catch {
    return ''
  }
}

async function buildSystemPrompt(): Promise<string> {
  const [contract, memory, data] = await Promise.all([
    readFileSafe('workspace/CLAUDE.md'),
    readFileSafe('workspace/MEMORY.md'),
    summarize(),
  ])

  return [
    'Eres el motor de una página web personal y viva. Tu único trabajo es',
    'CONSTRUIR y MEJORAR esta misma página a petición del usuario, editando',
    'código real dentro del sandbox. Fuera de esta página no tienes nada que',
    'hacer (aunque sí puedes buscar en la web para informarte).',
    '',
    'Reglas del sandbox (obligatorias):',
    '- SOLO puedes escribir/editar dentro de: src/app-surface/ , data/ y workspace/.',
    '- NUNCA toques el núcleo (server/, src/core/, src/main.tsx, src/App.tsx, config):',
    '  es el canal de chat y el andamiaje; romperlo te dejaría sin voz.',
    '- No tienes shell (Bash). Trabaja solo con ficheros y búsqueda web.',
    '',
    'Cómo se construyen features (léelo bien):',
    'Cada feature es un fichero en src/app-surface/features/<Nombre>.tsx que exporta',
    'por defecto un objeto { id, title, size, Component }. El dashboard las descubre',
    'automáticamente y Vite recarga en caliente: no hace falta registrar nada más.',
    'Usa el ejemplo Calendar.tsx como referencia. Para persistir datos usa el hook',
    "useStore(key, valorInicial) de '../../core/useStore' (guarda en data/store.json,",
    'la memoria compartida que tú también puedes leer).',
    '',
    'Cuando el usuario te pida algo:',
    '1) Actúa: crea o edita los ficheros necesarios en la superficie editable.',
    '2) Cuida el diseño: minimalista, responsive (móvil y escritorio), presentable.',
    '3) Respeta el tope de features y las reglas de estilo del contrato (CLAUDE.md).',
    '4) Actualiza workspace/MEMORY.md con lo que has construido y por qué.',
    '5) Responde breve en el chat: qué has hecho, en una o dos frases.',
    '',
    '## CONTRATO (workspace/CLAUDE.md)',
    contract || '(vacío)',
    '',
    '## MEMORIA NARRATIVA (workspace/MEMORY.md)',
    memory || '(vacío)',
    '',
    '## MEMORIA ESTRUCTURADA ACTUAL (data/store.json)',
    '```json',
    data,
    '```',
  ].join('\n')
}

/**
 * Ejecuta una petición contra Claude Code (Agent SDK) y va emitiendo eventos.
 * Acota el sistema de ficheros con cwd = raíz del proyecto y refuerza el
 * sandbox con canUseTool (las escrituras fuera de la superficie se deniegan).
 * Mantiene la memoria de conversación reusando sessionId (resume).
 */
export async function* runClaude(
  prompt: string,
  sessionId?: string,
): AsyncGenerator<ChatEvent> {
  const systemPrompt = await buildSystemPrompt()
  let currentSession = sessionId

  const stream = query({
    prompt,
    options: {
      cwd: PROJECT_ROOT,
      resume: sessionId || undefined,
      model: 'claude-opus-4-8',
      systemPrompt,
      allowedTools: READONLY_TOOLS,
      disallowedTools: ['Bash'],
      permissionMode: 'default',
      canUseTool: async (toolName: string, input: Record<string, unknown>) => {
        if (WRITE_TOOLS.has(toolName)) {
          if (isWritablePath(input?.file_path as string)) {
            return { behavior: 'allow', updatedInput: input }
          }
          return {
            behavior: 'deny',
            message:
              'Fuera del sandbox. Solo puedes editar src/app-surface/, data/ o workspace/.',
          }
        }
        // Cualquier otra herramienta que llegue aquí (no es de lectura ni de
        // escritura permitida) se rechaza.
        return { behavior: 'deny', message: `Herramienta no permitida: ${toolName}` }
      },
    },
  })

  for await (const message of stream as AsyncIterable<any>) {
    if (message?.type === 'system' && message?.subtype === 'init') {
      currentSession = message.session_id ?? currentSession
    } else if (message?.type === 'assistant') {
      const blocks = message?.message?.content ?? []
      for (const block of blocks) {
        if (block?.type === 'text' && block.text) {
          yield { type: 'text', text: block.text }
        } else if (block?.type === 'tool_use' && block.name) {
          yield { type: 'tool', tool: block.name }
        }
      }
    } else if (message?.type === 'result') {
      currentSession = message.session_id ?? currentSession
      if (message.subtype && message.subtype !== 'success') {
        yield { type: 'error', reason: String(message.subtype), sessionId: currentSession }
      } else {
        yield { type: 'done', sessionId: currentSession }
      }
    }
  }
}
